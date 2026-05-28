"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const MAX_BYTES = 2 * 1024 * 1024;

export async function uploadProfileAvatar(
  formData: FormData
): Promise<{ avatarUrl?: string; error?: string }> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Aucun fichier sélectionné." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Image trop grande. Maximum 2 Mo." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Fichier invalide. Choisissez une image." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Session expirée. Reconnectez-vous." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const contentType = file.type || "image/jpeg";

  let avatarUrl: string;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, bytes, { upsert: true, contentType });

  if (!uploadError) {
    const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    // Validate reachability. If local Storage/Kong is flaky, persist a stable data URL fallback.
    try {
      const check = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
      avatarUrl = check.ok ? publicUrl : `data:${contentType};base64,${bytes.toString("base64")}`;
    } catch {
      avatarUrl = `data:${contentType};base64,${bytes.toString("base64")}`;
    }
  } else {
    // Fallback dev : Storage Docker local peut échouer (search_path). Stocke en data URL.
    avatarUrl = `data:${contentType};base64,${bytes.toString("base64")}`;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("user_id", user.id);

  if (profileError) {
    return { error: profileError.message || "Impossible de mettre à jour le profil." };
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });
  if (metaError) {
    return { error: metaError.message || "Impossible de mettre à jour la session." };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { avatarUrl };
}
