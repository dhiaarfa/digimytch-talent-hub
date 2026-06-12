"use server";
import { logger } from "@/lib/logger";

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
  activeUserCount: number;
  feedbackCount: number;
};

export type AdminUserRow = {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string | null;
  isAdmin: boolean;
  isActive: boolean;
  resumeCount?: number;
  jobCount?: number;
};

export type AdminAnalytics = {
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  resumesLast7Days: number;
  jobsLast7Days: number;
  totalFeedback: number;
  poorExperienceCount: number;
  unrepliedComplaints: number;
  activeUsersLast7Days: number;
};

export type PlatformSetting = {
  key: string;
  value: string;
  label: string;
  description: string;
  type: "boolean" | "number" | "string";
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
    logger.error("[getAdminStats] listUsers", usersError);
  }

  const users = usersData?.users ?? [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const activeUserCount = users.filter(
    (u) => u.last_sign_in_at && u.last_sign_in_at >= sevenDaysAgo
  ).length;

  let feedbackCount = 0;
  try {
    const { count } = await service
      .from("candidate_feedback")
      .select("*", { count: "exact", head: true });
    feedbackCount = count ?? 0;
  } catch {}

  return {
    userCount: users.length,
    resumeCount: resumeCount ?? 0,
    jobCount: jobCount ?? 0,
    courseCount: courseCount ?? 0,
    activeUserCount,
    feedbackCount,
  };
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  await requireAdmin();
  const service = await createServiceClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: usersData } = await service.auth.admin.listUsers({ perPage: 1000 });
  const users = usersData?.users ?? [];
  const newUsersLast7Days = users.filter((u) => u.created_at >= sevenDaysAgo).length;
  const newUsersLast30Days = users.filter((u) => u.created_at >= thirtyDaysAgo).length;
  const activeUsersLast7Days = users.filter(
    (u) => u.last_sign_in_at && u.last_sign_in_at >= sevenDaysAgo
  ).length;

  const { count: resumesLast7Days } = await service
    .from("resumes")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);

  const { count: jobsLast7Days } = await service
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);

  let totalFeedback = 0;
  let poorExperienceCount = 0;
  let unrepliedComplaints = 0;
  try {
    const { data: feedbackData } = await service
      .from("candidate_feedback")
      .select("category,experience_choice,status");
    if (feedbackData) {
      totalFeedback = feedbackData.length;
      poorExperienceCount = feedbackData.filter(
        (f) => f.experience_choice === "poor"
      ).length;
      unrepliedComplaints = feedbackData.filter(
        (f) =>
          (f.category === "complaint" || f.category === "suggestion") &&
          f.status !== "replied"
      ).length;
    }
  } catch {}

  return {
    newUsersLast7Days,
    newUsersLast30Days,
    resumesLast7Days: resumesLast7Days ?? 0,
    jobsLast7Days: jobsLast7Days ?? 0,
    totalFeedback,
    poorExperienceCount,
    unrepliedComplaints,
    activeUsersLast7Days,
  };
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  await requireAdmin();
  const service = await createServiceClient();
  const { data, error } = await service.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    throw new Error(error.message);
  }

  // Get per-user resume and job counts
  const { data: resumeData } = await service
    .from("resumes")
    .select("user_id");
  const { data: jobData } = await service
    .from("jobs")
    .select("user_id");

  const resumeCounts: Record<string, number> = {};
  const jobCounts: Record<string, number> = {};
  resumeData?.forEach((r) => {
    resumeCounts[r.user_id] = (resumeCounts[r.user_id] ?? 0) + 1;
  });
  jobData?.forEach((j) => {
    jobCounts[j.user_id] = (jobCounts[j.user_id] ?? 0) + 1;
  });

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
        resumeCount: resumeCounts[user.id] ?? 0,
        jobCount: jobCounts[user.id] ?? 0,
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

export async function deleteAdminUser(
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await requireAdmin();
    if (admin.id === userId) {
      return { ok: false, error: "Vous ne pouvez pas supprimer votre propre compte." };
    }
    const service = await createServiceClient();
    const { error } = await service.auth.admin.deleteUser(userId);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Suppression impossible",
    };
  }
}

export async function resetAdminUserPassword(
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const service = await createServiceClient();
    // Get user email first
    const { data: userData, error: userError } = await service.auth.admin.getUserById(userId);
    if (userError || !userData.user?.email) {
      throw new Error("Utilisateur introuvable.");
    }
    const { error } = await service.auth.resetPasswordForEmail(userData.user.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/update-password`,
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Impossible d'envoyer l'email de réinitialisation",
    };
  }
}

export async function setAdminUserRole(
  userId: string,
  isAdmin: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await requireAdmin();
    if (admin.id === userId) {
      return { ok: false, error: "Vous ne pouvez pas modifier votre propre rôle." };
    }
    const service = await createServiceClient();
    const { error } = await service.auth.admin.updateUserById(userId, {
      app_metadata: { is_admin: isAdmin },
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Impossible de modifier le rôle",
    };
  }
}

export async function exportUsersCSV(): Promise<{ ok: true; csv: string } | { ok: false; error: string }> {
  try {
    const users = await listAdminUsers();
    const header = "Email,Inscription,Dernière connexion,Rôle,Statut,CV,Offres";
    const rows = users.map((u) => {
      const inscription = new Date(u.createdAt).toLocaleDateString("fr-FR");
      const lastSignIn = u.lastSignIn
        ? new Date(u.lastSignIn).toLocaleDateString("fr-FR")
        : "Jamais";
      const role = u.isAdmin ? "Admin" : "Candidat";
      const status = u.isActive ? "Actif" : "Désactivé";
      return [u.email, inscription, lastSignIn, role, status, u.resumeCount ?? 0, u.jobCount ?? 0]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    return { ok: true, csv: [header, ...rows].join("\n") };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Export impossible",
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
