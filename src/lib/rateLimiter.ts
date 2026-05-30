const memoryStore = new Map<string, number[]>();

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`);
    this.name = "RateLimitError";
  }
}

function consumeInMemory(key: string): number {
  const now = Date.now();
  const start = now - 60_000;
  const items = memoryStore.get(key) ?? [];
  const recent = items.filter((ts) => ts >= start);
  if (recent.length >= 10) {
    const oldest = recent[0];
    return Math.max(1, Math.ceil((oldest + 60_000 - now) / 1000));
  }
  recent.push(now);
  memoryStore.set(key, recent);
  return 0;
}

export async function checkRateLimit(userId: string, scope = "global"): Promise<void> {
  const key = `${userId}:${scope}`;

  const retryAfter = consumeInMemory(key);
  if (retryAfter > 0) {
    throw new RateLimitError(retryAfter);
  }
}
