"use server";
import { logger } from "@/lib/logger";

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
import { getCachedAuthUser } from "@/lib/server-auth";
import { joinApplicationsWithActiveJobs } from "@/lib/job-applications";
import { runJobApplicationUpsert } from "@/lib/job-applications-upsert";

function isApplicationStatus(s: string): s is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(s);
}

export async function listJobApplications(): Promise<JobApplicationWithJob[]> {
  const { user } = await getCachedAuthUser();
  if (!user) throw new Error("Non authentifié");

  const supabase = await createClient();
  const { data: apps, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(200); // cap — prevents unbounded scans

  if (error) {
    logger.error("[listJobApplications]", error);
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
    .in("id", jobIds)
    .is("deleted_at", null);

  if (jobErr || !jobs) {
    throw new Error("Impossible de charger les offres liées.");
  }

  return joinApplicationsWithActiveJobs(list as JobApplication[], jobs as Job[]);
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
    .is("deleted_at", null)
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

  const result = await runJobApplicationUpsert(
    {
      fetchActiveJob: async (jobId) => {
        const { data } = await supabase
          .from("jobs")
          .select("id")
          .eq("id", jobId)
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .maybeSingle();
        return data;
      },
      fetchApplicationByJob: async (jobId) => {
        const { data } = await supabase
          .from("job_applications")
          .select("*")
          .eq("user_id", user.id)
          .eq("job_id", jobId)
          .maybeSingle();
        return data as (JobApplication & { deleted_at?: string | null }) | null;
      },
      updateApplication: async (id, patch) => {
        const { data: updated, error } = await supabase
          .from("job_applications")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error || !updated) {
          logger.error("[upsertJobApplication] update", error);
          throw new Error("Mise à jour impossible");
        }
        return updated as JobApplication & { deleted_at?: string | null };
      },
      insertApplication: async (row) => {
        const { data: created, error } = await supabase
          .from("job_applications")
          .insert({
            user_id: user.id,
            job_id: row.job_id,
            resume_id: row.resume_id,
            status: row.status,
            notes: row.notes,
          })
          .select()
          .single();
        return {
          data: created as (JobApplication & { deleted_at?: string | null }) | null,
          error,
        };
      },
      insertStatusEvent: async (event) => {
        await supabase.from("job_application_events").insert(event);
      },
    },
    input
  );

  revalidatePath("/candidatures");
  revalidatePath("/jobs");
  revalidatePath("/home");
  return result;
}

async function persistApplicationStatusChange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    applicationId: string;
    userId: string;
    prevStatus: string;
    nextStatus: ApplicationStatus;
    note?: string | null;
  }
): Promise<void> {
  const { error: updateError } = await supabase
    .from("job_applications")
    .update({ status: input.nextStatus })
    .eq("id", input.applicationId)
    .eq("user_id", input.userId);

  if (updateError) {
    logger.error("[updateJobApplicationStatus] update", updateError);
    throw new Error("Mise à jour impossible");
  }

  if (input.prevStatus !== input.nextStatus) {
    const { error: eventError } = await supabase.from("job_application_events").insert({
      application_id: input.applicationId,
      from_status: input.prevStatus,
      to_status: input.nextStatus,
      note: input.note?.trim() ?? null,
    });
    if (eventError) {
      logger.error("[updateJobApplicationStatus] event", eventError);
    }
  } else if (input.note?.trim()) {
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
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) throw new Error("Candidature introuvable");

  const prevStatus = existing.status as string;
  const nextStatus = input.status;

  const { error: rpcError } = await supabase.rpc("update_application_status", {
    app_id: input.applicationId,
    new_status: nextStatus,
    user_id: user.id,
  });

  if (rpcError) {
    const rpcMissing =
      rpcError.code === "PGRST202" ||
      rpcError.message?.includes("update_application_status") ||
      rpcError.message?.includes("Could not find the function");

    if (!rpcMissing) {
      logger.error("[updateJobApplicationStatus] rpc", rpcError);
    }

    await persistApplicationStatusChange(supabase, {
      applicationId: input.applicationId,
      userId: user.id,
      prevStatus,
      nextStatus,
      note: input.note,
    });
  } else if (input.note?.trim()) {
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
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) throw new Error("Suppression impossible");
  revalidatePath("/candidatures");
  revalidatePath("/corbeille");
}
