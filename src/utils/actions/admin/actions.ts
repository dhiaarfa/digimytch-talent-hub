"use server";

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

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || !isAdminUser(user.email)) {
    throw new Error("Accès administrateur requis.");
  }
  return user;
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const service = await createServiceClient();

  const { count: courseCount } = await service
    .from("courses")
    .select("*", { count: "exact", head: true });

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
    const { error } = await service.from("courses").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Suppression impossible",
    };
  }
}
