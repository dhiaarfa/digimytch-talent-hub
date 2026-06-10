"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/utils/supabase/server";
import { isAdminUser } from "@/lib/digimytch-config";
import type { Course } from "@/lib/types";
import { suggestCourseImageUrl } from "@/lib/card-images";
import { listCourses } from "@/utils/actions/courses/actions";

export type AdminCourseInput = {
  title: string;
  provider: string;
  level: string;
  skills_targeted: string[];
  url?: string | null;
  image_url?: string | null;
};

export type AdminStats = {
  userCount: number;
  resumeCount: number;
  jobCount: number;
  courseCount: number;
};

export type AdminUserRow = {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string | null;
  isAdmin: boolean;
  isActive: boolean;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || !isAdminUser(user)) {
    throw new Error("Accès administrateur requis.");
  }
  return user;
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const service = await createServiceClient();

  const { count: courseCount } = await service
    .from("courses")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  const { count: resumeCount } = await service
    .from("resumes")
    .select("*", { count: "exact", head: true });

  const { count: jobCount } = await service
    .from("jobs")
    .select("*", { count: "exact", head: true });

  const { data: usersData, error: usersError } =
    await service.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) {
    console.error("[getAdminStats] listUsers", usersError);
  }

  return {
    userCount: usersData?.users?.length ?? 0,
    resumeCount: resumeCount ?? 0,
    jobCount: jobCount ?? 0,
    courseCount: courseCount ?? 0,
  };
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  await requireAdmin();
  const service = await createServiceClient();
  const { data, error } = await service.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    throw new Error(error.message);
  }

  return (data?.users ?? [])
    .map((user) => {
      const meta = user.app_metadata as { is_admin?: boolean } | undefined;
      const bannedUntilRaw = (user as { banned_until?: string | null }).banned_until;
      const bannedUntil = bannedUntilRaw ? new Date(bannedUntilRaw).getTime() : null;
      const isBanned = bannedUntil !== null && bannedUntil > Date.now();

      return {
        id: user.id,
        email: user.email ?? "(sans email)",
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at ?? null,
        isAdmin: Boolean(meta?.is_admin),
        isActive: !isBanned,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function setAdminUserActive(
  userId: string,
  active: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await requireAdmin();
    if (admin.id === userId && !active) {
      return { ok: false, error: "Vous ne pouvez pas désactiver votre propre compte." };
    }

    const service = await createServiceClient();
    const { error } = await service.auth.admin.updateUserById(userId, {
      ban_duration: active ? "none" : "876000h",
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Mise à jour impossible",
    };
  }
}

/** Alias admin — même catalogue que listCourses */
export async function getCourses(): Promise<Course[]> {
  await requireAdmin();
  return listCourses();
}

export async function createCourse(
  input: AdminCourseInput
): Promise<{ ok: true; course: Course } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const service = await createServiceClient();
    const imageUrl =
      input.image_url?.trim() ||
      suggestCourseImageUrl(input.title.trim(), input.skills_targeted);
    const { data, error } = await service
      .from("courses")
      .insert({
        title: input.title.trim(),
        provider: input.provider.trim(),
        level: input.level.trim() || "Intermédiaire",
        skills_targeted: input.skills_targeted,
        url: input.url?.trim() || null,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) throw error;
    return { ok: true, course: data as Course };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Création impossible",
    };
  }
}

export async function updateCourse(
  id: string,
  input: AdminCourseInput
): Promise<{ ok: true; course: Course } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const service = await createServiceClient();
    const imageUrl =
      input.image_url?.trim() ||
      suggestCourseImageUrl(input.title.trim(), input.skills_targeted);
    const { data, error } = await service
      .from("courses")
      .update({
        title: input.title.trim(),
        provider: input.provider.trim(),
        level: input.level.trim() || "Intermédiaire",
        skills_targeted: input.skills_targeted,
        url: input.url?.trim() || null,
        image_url: imageUrl,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { ok: true, course: data as Course };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Mise à jour impossible",
    };
  }
}

export async function deleteCourse(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const service = await createServiceClient();
    const { error } = await service
      .from("courses")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin");
    revalidatePath("/corbeille");
    revalidatePath("/formations");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Suppression impossible",
    };
  }
}
