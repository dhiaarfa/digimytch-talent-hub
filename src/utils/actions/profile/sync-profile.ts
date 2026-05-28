"use server";

import { createClient } from "@/utils/supabase/server";

/** Réaligne la session auth sur le profil DB (avatar, nom) après connexion. */
export async function syncProfileToAuthSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, full_name, first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) return;

  const fullName =
    profile.full_name?.trim() ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();

  const meta: Record<string, string> = {};
  if (fullName) meta.full_name = fullName;
  // JWT metadata : URLs http seulement (les data URLs sont trop volumineuses)
  if (
    profile.avatar_url &&
    !profile.avatar_url.startsWith("data:") &&
    profile.avatar_url.length < 2048
  ) {
    meta.avatar_url = profile.avatar_url;
  }

  if (Object.keys(meta).length > 0) {
    await supabase.auth.updateUser({ data: meta });
  }
}
