const PLACEHOLDER_ANON = "your_anon_key_here";

function normalizeSupabaseUrl(raw: string): string {
  try {
    const url = new URL(raw);
    if (url.hostname === "localhost") {
      url.hostname = "127.0.0.1";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return raw.replace("localhost", "127.0.0.1").replace(/\/$/, "");
  }
}

/** Returns null instead of throwing — safe for Edge middleware on Vercel. */
export function getSupabaseUrlSafe(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return normalizeSupabaseUrl(raw);
  } catch {
    return null;
  }
}

export function getSupabaseAnonKeySafe(): string | null {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key || key === PLACEHOLDER_ANON) return null;
  return key;
}

/**
 * Normalise l'URL Supabase pour éviter ECONNREFUSED avec `localhost` (IPv6) côté Node/Edge.
 */
export function getSupabaseUrl(): string {
  const safe = getSupabaseUrlSafe();
  if (!safe) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  return safe;
}
