const SUPABASE_COOKIE_PREFIX = "sb-";

/** Remove Supabase auth cookies + storage in the browser (no network). */
export function clearBrowserSupabaseSession(): void {
  if (typeof window === "undefined") return;

  const hostname = window.location.hostname;

  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (!name?.startsWith(SUPABASE_COOKIE_PREFIX)) continue;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${hostname}`;
  }

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(SUPABASE_COOKIE_PREFIX)) localStorage.removeItem(key);
  }

  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(SUPABASE_COOKIE_PREFIX)) sessionStorage.removeItem(key);
  }
}

export function hasSupabaseAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => {
    const name = c.trim().split("=")[0];
    return name?.startsWith(SUPABASE_COOKIE_PREFIX);
  });
}

export async function isSupabaseReachable(timeoutMs = 5000): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    return false;
  }
}
