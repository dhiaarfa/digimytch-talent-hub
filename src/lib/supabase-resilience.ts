import { logger } from "@/lib/logger";
import type { User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const DEFAULT_AUTH_TIMEOUT_MS = 900;
const PASSTHROUGH_AUTH_TIMEOUT_MS = 400;
const SUPABASE_COOKIE_PREFIX = "sb-";

type AuthUserResult = {
  user: User | null;
  unavailable: boolean;
};

/**
 * Avoid hanging SSR/middleware when Supabase is down or misconfigured.
 */
export async function getAuthUserWithTimeout(
  getUser: () => Promise<{ data: { user: User | null } }>,
  timeoutMs = DEFAULT_AUTH_TIMEOUT_MS
): Promise<AuthUserResult> {
  try {
    const { data } = await Promise.race([
      getUser(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("SUPABASE_AUTH_TIMEOUT")), timeoutMs);
      }),
    ]);
    return { user: data.user, unavailable: false };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.warn(
        "[Digimytch] Supabase auth unreachable or timed out:",
        error instanceof Error ? error.message : error
      );
    }
    return { user: null, unavailable: true };
  }
}

export function getAuthTimeoutForRequest(request: NextRequest): number {
  return isDataPassthroughRequest(request)
    ? PASSTHROUGH_AUTH_TIMEOUT_MS
    : DEFAULT_AUTH_TIMEOUT_MS;
}

export function isPublicAppRoute(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/auth");
}

/** Supabase session cookie present (middleware-safe, no document). */
export function hasSupabaseAuthCookieFromRequest(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) =>
    cookie.name.startsWith(SUPABASE_COOKIE_PREFIX)
  );
}

/**
 * Server Actions and RSC fetches must never receive HTML redirects from middleware —
 * the client expects a structured protocol response.
 */
export function isDataPassthroughRequest(request: NextRequest): boolean {
  if (request.headers.has("next-action") || request.headers.has("Next-Action")) {
    return true;
  }

  const rsc = request.headers.get("rsc") ?? request.headers.get("RSC");
  if (rsc === "1") {
    return true;
  }

  if (request.headers.has("Next-Router-State-Tree")) {
    return true;
  }

  if (
    request.headers.get("x-router-prefetch") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1"
  ) {
    return true;
  }

  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/x-component")) {
    return true;
  }

  if (request.nextUrl.searchParams.has("_rsc")) {
    return true;
  }

  return false;
}
