"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, User, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { uploadProfileAvatar } from "@/utils/actions/profile/avatar-actions";

export type ProfileSectionUser = {
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
};

export function ProfileSection({ user }: { user: ProfileSectionUser }) {
  const [name, setName] = useState(user.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "");
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setName(user.full_name || "");
    setAvatarUrl(user.avatar_url || "");
    setAvatarBroken(false);
  }, [user.full_name, user.avatar_url]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image trop grande. Maximum 2 Mo.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Fichier invalide. Choisissez une image.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("avatar", file);
      const result = await uploadProfileAvatar(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.avatarUrl) {
        setAvatarUrl(result.avatarUrl);
        setAvatarBroken(false);
      }
      toast.success("Photo de profil mise à jour");
      router.refresh();
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error("Erreur lors de l'upload de la photo.");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSaveName = async () => {
    setIsSaving(true);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error("Session expirée. Reconnectez-vous.");
        return;
      }

      const trimmed = name.trim();
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: trimmed || null })
        .eq("user_id", authUser.id);

      if (profileError) throw profileError;

      await supabase.auth.updateUser({ data: { full_name: trimmed } });
      toast.success("Nom enregistré");
      router.refresh();
    } catch (err) {
      console.error("Profile name save failed:", err);
      toast.error("Impossible d'enregistrer le nom.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="profile" className="border rounded-xl p-6 bg-white/80 backdrop-blur-xl border-white/40 shadow-xl shadow-black/5">
      <h2 className="font-semibold text-lg mb-4">Mon profil</h2>

      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#030A8C] to-[#D10069] flex items-center justify-center">
            {avatarUrl && !avatarBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <User size={32} className="text-white" aria-hidden />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 shadow-sm"
            aria-label="Changer la photo"
          >
            {isUploading ? (
              <div
                className="w-3 h-3 border border-[#030A8C] border-t-transparent rounded-full animate-spin"
                aria-hidden
              />
            ) : (
              <Camera size={13} aria-hidden />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleAvatarChange(e)}
          />
        </div>

        <div className="flex-1 space-y-3 w-full min-w-0">
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="profile-full-name">
              Nom complet
            </label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <input
                id="profile-full-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#030A8C]/20"
                placeholder="Votre nom complet"
              />
              <button
                type="button"
                onClick={() => void handleSaveName()}
                disabled={isSaving}
                className="flex items-center justify-center gap-1.5 bg-[#030A8C] text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50 shrink-0"
              >
                <Save size={14} aria-hidden />
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-sm text-muted-foreground mt-1 px-3 py-2 bg-gray-50 rounded-lg">
              {user.email}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Photo : JPG, PNG, max 2 Mo. Visible dans la sidebar et votre CV.
          </p>
        </div>
      </div>
    </div>
  );
}
