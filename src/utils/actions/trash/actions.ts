"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/utils/supabase/server";
import { isAdminUser } from "@/lib/digimytch-config";
import {
  TRASH_RETENTION_DAYS,
  trashExpiryCutoff,
  type TrashEntityType,
} from "@/lib/trash";

export interface TrashItem {
  id: string;
  entityType: TrashEntityType;
  label: string;
  deletedAt: string;
  daysRemaining: number;
}

async function purgeExpiredForUser(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const cutoff = trashExpiryCutoff().toISOString();

  await supabase
    .from("resumes")
    .delete()
    .eq("user_id", userId)
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff);

  await supabase
    .from("jobs")
    .delete()
    .eq("user_id", userId)
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff);

  await supabase
    .from("job_applications")
    .delete()
    .eq("user_id", userId)
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff);
}

async function purgeExpiredCourses(service: Awaited<ReturnType<typeof createServiceClient>>) {
  const cutoff = trashExpiryCutoff().toISOString();
  await service
    .from("courses")
    .delete()
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff);
}

function daysRemaining(deletedAt: string): number {
  const purgeAt = new Date(deletedAt);
  purgeAt.setDate(purgeAt.getDate() + TRASH_RETENTION_DAYS);
  return Math.max(0, Math.ceil((purgeAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export async function listUserTrash(): Promise<TrashItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Non authentifié");

  await purgeExpiredForUser(user.id, supabase);

  const cutoff = trashExpiryCutoff().toISOString();
  const items: TrashItem[] = [];

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, name, deleted_at")
    .eq("user_id", user.id)
    .not("deleted_at", "is", null)
    .gte("deleted_at", cutoff)
    .order("deleted_at", { ascending: false });

  for (const r of resumes ?? []) {
    if (!r.deleted_at) continue;
    items.push({
      id: r.id,
      entityType: "resume",
      label: r.name || "CV",
      deletedAt: r.deleted_at,
      daysRemaining: daysRemaining(r.deleted_at),
    });
  }

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, position_title, company_name, deleted_at")
    .eq("user_id", user.id)
    .not("deleted_at", "is", null)
    .gte("deleted_at", cutoff)
    .order("deleted_at", { ascending: false });

  for (const j of jobs ?? []) {
    if (!j.deleted_at) continue;
    items.push({
      id: j.id,
      entityType: "job",
      label: [j.position_title, j.company_name].filter(Boolean).join(" · ") || "Offre",
      deletedAt: j.deleted_at,
      daysRemaining: daysRemaining(j.deleted_at),
    });
  }

  const { data: apps } = await supabase
    .from("job_applications")
    .select("id, job_id, deleted_at")
    .eq("user_id", user.id)
    .not("deleted_at", "is", null)
    .gte("deleted_at", cutoff)
    .order("deleted_at", { ascending: false });

  const appJobIds = [...new Set((apps ?? []).map((a) => a.job_id).filter(Boolean))];
  const appJobLabels = new Map<string, string>();
  if (appJobIds.length > 0) {
    const { data: appJobs } = await supabase
      .from("jobs")
      .select("id, position_title, company_name")
      .in("id", appJobIds);
    for (const j of appJobs ?? []) {
      appJobLabels.set(
        j.id,
        [j.position_title, j.company_name].filter(Boolean).join(" · ") || "Offre"
      );
    }
  }

  for (const a of apps ?? []) {
    if (!a.deleted_at) continue;
    items.push({
      id: a.id,
      entityType: "application",
      label: appJobLabels.get(a.job_id) ?? "Candidature",
      deletedAt: a.deleted_at,
      daysRemaining: daysRemaining(a.deleted_at),
    });
  }

  items.sort(
    (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
  );
  return items;
}

export async function listAdminTrash(): Promise<TrashItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || !isAdminUser(user)) {
    throw new Error("Accès administrateur requis.");
  }

  const service = await createServiceClient();
  await purgeExpiredCourses(service);

  const cutoff = trashExpiryCutoff().toISOString();
  const { data: courses } = await service
    .from("courses")
    .select("id, title, deleted_at")
    .not("deleted_at", "is", null)
    .gte("deleted_at", cutoff)
    .order("deleted_at", { ascending: false });

  return (courses ?? [])
    .filter((c) => c.deleted_at)
    .map((c) => ({
      id: c.id,
      entityType: "course" as const,
      label: c.title || "Formation",
      deletedAt: c.deleted_at!,
      daysRemaining: daysRemaining(c.deleted_at!),
    }));
}

export async function restoreTrashItem(
  entityType: TrashEntityType,
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (entityType === "course") {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user || !isAdminUser(user)) {
      return { ok: false, error: "Accès administrateur requis." };
    }
    const service = await createServiceClient();
    const { error: upErr } = await service
      .from("courses")
      .update({ deleted_at: null })
      .eq("id", id)
      .not("deleted_at", "is", null);
    if (upErr) return { ok: false, error: upErr.message };
    revalidatePath("/admin");
    revalidatePath("/formations");
    revalidatePath("/corbeille");
    return { ok: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Non authentifié" };

  const cutoff = trashExpiryCutoff().toISOString();
  const table =
    entityType === "resume"
      ? "resumes"
      : entityType === "job"
        ? "jobs"
        : "job_applications";

  const { data: row, error: fetchErr } = await supabase
    .from(table)
    .select("id, deleted_at, job_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr || !row?.deleted_at) {
    return { ok: false, error: "Élément introuvable dans la corbeille." };
  }
  if (row.deleted_at < cutoff) {
    return { ok: false, error: "Délai de restauration dépassé (30 jours)." };
  }

  const { error: upErr } = await supabase
    .from(table)
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (upErr) return { ok: false, error: upErr.message };

  if (entityType === "resume" && "job_id" in row && row.job_id) {
    await supabase
      .from("jobs")
      .update({ deleted_at: null })
      .eq("id", row.job_id as string)
      .eq("user_id", user.id);
  }

  if (entityType === "application" && "job_id" in row && row.job_id) {
    await supabase
      .from("jobs")
      .update({ deleted_at: null })
      .eq("id", row.job_id as string)
      .eq("user_id", user.id);
  }

  if (entityType === "job") {
    await supabase
      .from("job_applications")
      .update({ deleted_at: null })
      .eq("job_id", id)
      .eq("user_id", user.id)
      .not("deleted_at", "is", null);
  }

  revalidatePath("/", "layout");
  revalidatePath("/corbeille");
  revalidatePath("/resumes");
  revalidatePath("/jobs");
  revalidatePath("/candidatures");
  revalidatePath("/formations");
  return { ok: true };
}

export async function permanentlyDeleteTrashItem(
  entityType: TrashEntityType,
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (entityType === "course") {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user || !isAdminUser(user)) {
      return { ok: false, error: "Accès administrateur requis." };
    }
    const service = await createServiceClient();
    const { error: delErr } = await service
      .from("courses")
      .delete()
      .eq("id", id)
      .not("deleted_at", "is", null);
    if (delErr) return { ok: false, error: delErr.message };
    revalidatePath("/admin");
    revalidatePath("/corbeille");
    return { ok: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Non authentifié" };

  const table =
    entityType === "resume"
      ? "resumes"
      : entityType === "job"
        ? "jobs"
        : "job_applications";

  const { error: delErr } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .not("deleted_at", "is", null);

  if (delErr) return { ok: false, error: delErr.message };

  revalidatePath("/", "layout");
  revalidatePath("/corbeille");
  return { ok: true };
}
