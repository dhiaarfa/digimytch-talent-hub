"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  ApplicationStatus,
  Job,
  JobApplication,
  JobApplicationEvent,
  JobApplicationWithJob,
} from "@/lib/types";
import { APPLICATION_STATUSES } from "@/lib/types";

function isApplicationStatus(s: string): s is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(s);
}

export async function listJobApplications(): Promise<JobApplicationWithJob[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Non authentifié");

  const { data: apps, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[listJobApplications]", error);
    throw new Error(
      "Impossible de charger les candidatures. Vérifiez la migration SQL Digimytch."
    );
  }

  const list = apps ?? [];
  if (list.length === 0) return [];

  const jobIds = [...new Set(list.map((a) => a.job_id))];
  const { data: jobs, error: jobErr } = await supabase
    .from("jobs")
    .select("*")
    .in("id", jobIds);

  if (jobErr || !jobs) {
    throw new Error("Impossible de charger les offres liées.");
  }

  const jobMap = new Map(jobs.map((j) => [j.id, j as Job]));
  return list.map((a) => ({
    ...(a as JobApplication),
    job: jobMap.get(a.job_id)!,
  }));
}

export async function listApplicationEvents(
  applicationId: string
): Promise<JobApplicationEvent[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Non authentifié");

  const { data: app } = await supabase
    .from("job_applications")
    .select("id")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!app) throw new Error("Candidature introuvable");

  const { data, error } = await supabase
    .from("job_application_events")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Impossible de charger l’historique.");
  return (data ?? []) as JobApplicationEvent[];
}

export async function upsertJobApplication(input: {
  jobId: string;
  resumeId?: string | null;
  status?: ApplicationStatus;
  notes?: string | null;
}): Promise<JobApplication> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Non authentifié");

  const status = input.status ?? "saved";

  const { data: existing } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", user.id)
    .eq("job_id", input.jobId)
    .maybeSingle();

  if (existing) {
    const prev = existing.status as string;
    const { data: updated, error } = await supabase
      .from("job_applications")
      .update({
        resume_id: input.resumeId ?? existing.resume_id,
        status,
        notes: input.notes ?? existing.notes,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error || !updated) throw new Error("Mise à jour impossible");

    if (prev !== status) {
      await supabase.from("job_application_events").insert({
        application_id: existing.id,
        from_status: prev,
        to_status: status,
        note: null,
      });
    }

    revalidatePath("/candidatures");
    revalidatePath("/jobs");
    return updated as JobApplication;
  }

  const { data: created, error } = await supabase
    .from("job_applications")
    .insert({
      user_id: user.id,
      job_id: input.jobId,
      resume_id: input.resumeId ?? null,
      status,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error || !created) throw new Error("Création candidature impossible");

  await supabase.from("job_application_events").insert({
    application_id: created.id,
    from_status: null,
    to_status: status,
    note: null,
  });

  revalidatePath("/candidatures");
  revalidatePath("/jobs");
  return created as JobApplication;
}

export async function updateJobApplicationStatus(input: {
  applicationId: string;
  status: string;
  note?: string | null;
}): Promise<void> {
  if (!isApplicationStatus(input.status)) {
    throw new Error("Statut invalide");
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Non authentifié");

  const { data: existing } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", input.applicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) throw new Error("Candidature introuvable");

  const { error } = await supabase.rpc("update_application_status", {
    app_id: input.applicationId,
    new_status: input.status,
    user_id: user.id,
  });

  if (error) throw new Error("Mise à jour impossible");

  if (input.note?.trim()) {
    const { data: latest } = await supabase
      .from("job_application_events")
      .select("id")
      .eq("application_id", input.applicationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest?.id) {
      await supabase
        .from("job_application_events")
        .update({ note: input.note.trim() })
        .eq("id", latest.id);
    }
  }

  revalidatePath("/candidatures");
}

export async function deleteJobApplication(applicationId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Non authentifié");

  const { error } = await supabase
    .from("job_applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) throw new Error("Suppression impossible");
  revalidatePath("/candidatures");
}
