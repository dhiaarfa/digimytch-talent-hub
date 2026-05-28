import type { User } from "@supabase/supabase-js";

const DEFAULT_AUTH_TIMEOUT_MS = 4_000;

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
      console.warn(
        "[Digimytch] Supabase auth unreachable or timed out:",
        error instanceof Error ? error.message : error
      );
    }
    return { user: null, unavailable: true };
  }
}

export function isPublicAppRoute(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/auth");
}
