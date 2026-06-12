import { logger } from "@/lib/logger";
/**
 * Rate limiter — sliding window (60 s / 10 requests per user per scope).
 *
 * Backend priority:
 *   1. Local Redis  (USE_LOCAL_REDIS=true + REDIS_URL)     — dev / self-hosted Docker
 *   2. Upstash REST (UPSTASH_REDIS_REST_URL + TOKEN)       — Vercel / cloud production
 *   3. In-process Map                                      — CI / test only (NOT safe for multi-instance prod)
 */

import IORedis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const KEY_PREFIX = "rl:";

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`);
    this.name = "RateLimitError";
  }
}

export class RateLimitBackendError extends Error {
  constructor(message = "Rate limiting unavailable") {
    super(message);
    this.name = "RateLimitBackendError";
  }
}

// ── In-process fallback (CI / no-Redis only) ──────────────────────────────────
const memoryStore = new Map<string, number[]>();

function consumeInMemory(key: string): number {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const items = (memoryStore.get(key) ?? []).filter((ts) => ts >= windowStart);
  if (items.length >= MAX_REQUESTS) {
    return Math.max(1, Math.ceil((items[0] + WINDOW_MS - now) / 1000));
  }
  items.push(now);
  memoryStore.set(key, items);
  return 0;
}

// ── Redis sliding window ──────────────────────────────────────────────────────
type SlidingWindowResult = { allowed: boolean; retryAfterSeconds: number };

async function consumeWithIORedis(client: IORedis, key: string): Promise<SlidingWindowResult> {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const fullKey = `${KEY_PREFIX}${key}`;
  const pipeline = client.pipeline();
  pipeline.zremrangebyscore(fullKey, "-inf", windowStart);
  pipeline.zcard(fullKey);
  const results = await pipeline.exec();
  const count = (results?.[1]?.[1] as number) ?? 0;
  if (count >= MAX_REQUESTS) {
    const oldest = await client.zrangebyscore(
      fullKey,
      "-inf",
      "+inf",
      "WITHSCORES",
      "LIMIT",
      0,
      1
    );
    const oldestTs = oldest?.[1] ? parseFloat(oldest[1]) : now - WINDOW_MS;
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((oldestTs + WINDOW_MS - now) / 1000)) };
  }
  await client.zadd(fullKey, now, `${now}-${Math.random()}`);
  await client.pexpire(fullKey, WINDOW_MS + 1000);
  return { allowed: true, retryAfterSeconds: 0 };
}

async function consumeWithUpstash(client: UpstashRedis, key: string): Promise<SlidingWindowResult> {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const fullKey = `${KEY_PREFIX}${key}`;
  const script = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local ws = tonumber(ARGV[2])
    local max = tonumber(ARGV[3])
    redis.call('ZREMRANGEBYSCORE', key, '-inf', ws)
    local count = redis.call('ZCARD', key)
    if count >= max then
      local oldest = redis.call('ZRANGEBYSCORE', key, '-inf', '+inf', 'LIMIT', 0, 1, 'WITHSCORES')
      return {0, oldest[2] or tostring(now - ${WINDOW_MS})}
    end
    redis.call('ZADD', key, now, ARGV[4])
    redis.call('PEXPIRE', key, ${WINDOW_MS + 1000})
    return {1, '0'}
  `;
  const result = await client.eval(script, [fullKey], [String(now), String(windowStart), String(MAX_REQUESTS), `${now}-${Math.random()}`]) as [number, string];
  if (result[0] === 0) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((parseFloat(result[1]) + WINDOW_MS - now) / 1000)) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

// ── Backend factory (singleton per process) ───────────────────────────────────
type Backend = { type: "ioredis"; client: IORedis } | { type: "upstash"; client: UpstashRedis } | { type: "memory" };

function resolveBackend(): Backend {
  if (process.env.USE_LOCAL_REDIS === "true" && process.env.REDIS_URL) {
    return { type: "ioredis", client: new IORedis(process.env.REDIS_URL, { lazyConnect: true, enableReadyCheck: false }) };
  }
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { type: "upstash", client: new UpstashRedis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN }) };
  }
  if (process.env.NODE_ENV === "production") {
    logger.warn("[RateLimiter] No Redis configured — in-process fallback is NOT safe for multi-instance deployments. Set REDIS_URL or UPSTASH_REDIS_REST_URL.");
  }
  return { type: "memory" };
}

let _backend: Backend | null = null;
function getBackend(): Backend {
  if (!_backend) _backend = resolveBackend();
  return _backend;
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function checkRateLimit(userId: string, scope = "global"): Promise<void> {
  const key = `${userId}:${scope}`;
  const backend = getBackend();

  if (backend.type === "memory" && process.env.NODE_ENV === "production") {
    throw new RateLimitBackendError(
      "Rate limiting requires Redis in production (REDIS_URL or UPSTASH_REDIS_REST_URL)."
    );
  }

  let result: SlidingWindowResult;
  try {
    if (backend.type === "ioredis") {
      result = await consumeWithIORedis(backend.client, key);
    } else if (backend.type === "upstash") {
      result = await consumeWithUpstash(backend.client, key);
    } else {
      const retryAfter = consumeInMemory(key);
      result = { allowed: retryAfter === 0, retryAfterSeconds: retryAfter };
    }
  } catch (err) {
    logger.error("[RateLimiter] Backend error:", err instanceof Error ? err.message : err);
    if (process.env.NODE_ENV === "production") {
      throw new RateLimitBackendError();
    }
    return;
  }
  if (!result.allowed) {
    throw new RateLimitError(result.retryAfterSeconds);
  }
}
