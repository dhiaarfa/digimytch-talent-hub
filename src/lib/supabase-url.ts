/**
 * Normalise l'URL Supabase pour éviter ECONNREFUSED avec `localhost` (IPv6) côté Node/Edge.
 */
export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
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
