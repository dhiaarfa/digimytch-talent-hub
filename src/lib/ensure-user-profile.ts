import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

/** Crée le profil s'il manque (évite les échecs silencieux sur l'éditeur CV). */
export async function ensureUserProfile(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!error && data) {
    return data as Profile;
  }

  if (error?.code !== "PGRST116") {
    throw new Error("Error fetching user profile");
  }

  const { data: created, error: createError } = await supabase
    .from("profiles")
    .insert([
      {
        user_id: userId,
        first_name: null,
        last_name: null,
        email: email ?? null,
        phone_number: null,
        location: null,
        website: null,
        linkedin_url: null,
        github_url: null,
        work_experience: [],
        education: [],
        skills: [],
        projects: [],
      },
    ])
    .select()
    .single();

  if (createError || !created) {
    throw new Error("Error creating user profile");
  }

  return created as Profile;
}
