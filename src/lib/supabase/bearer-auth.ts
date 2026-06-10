import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase-url";

export function createBearerSupabaseClient(accessToken: string): SupabaseClient {
  return createClient(getSupabaseUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function getUserFromBearerToken(accessToken: string) {
  const supabase = createBearerSupabaseClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);
  return { supabase, user: data.user, error };
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization") ?? request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}
