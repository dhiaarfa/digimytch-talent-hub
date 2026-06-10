import type { ApplicationStatus, JobApplication } from "@/lib/types";
import {
  buildApplicationUpsertPatch,
  jobMissingForApplicationMessage,
  shouldRecordStatusChange,
  upsertInsertErrorMessage,
} from "@/lib/job-applications";

export type JobApplicationRow = JobApplication & { deleted_at?: string | null };

export interface UpsertJobApplicationInput {
  jobId: string;
  resumeId?: string | null;
  status?: ApplicationStatus;
  notes?: string | null;
}

export interface JobApplicationUpsertDeps {
  fetchActiveJob: (jobId: string) => Promise<{ id: string } | null>;
  fetchApplicationByJob: (jobId: string) => Promise<JobApplicationRow | null>;
  updateApplication: (
    id: string,
    patch: ReturnType<typeof buildApplicationUpsertPatch>
  ) => Promise<JobApplicationRow>;
  insertApplication: (row: {
    job_id: string;
    resume_id: string | null;
    status: ApplicationStatus;
    notes: string | null;
  }) => Promise<{ data: JobApplicationRow | null; error: { code?: string; message?: string } | null }>;
  insertStatusEvent: (event: {
    application_id: string;
    from_status: string | null;
    to_status: string;
    note: null;
  }) => Promise<void>;
}

/**
 * Core upsert logic (DB-agnostic). Used by server action and integration tests.
 */
export async function runJobApplicationUpsert(
  deps: JobApplicationUpsertDeps,
  input: UpsertJobApplicationInput
): Promise<JobApplication> {
  const status = input.status ?? "saved";

  const jobRow = await deps.fetchActiveJob(input.jobId);
  if (!jobRow) {
    throw new Error(jobMissingForApplicationMessage());
  }

  async function updateExistingRow(existing: JobApplicationRow): Promise<JobApplication> {
    const prev = existing.status as string;
    const patch = buildApplicationUpsertPatch(existing, input);
    const updated = await deps.updateApplication(existing.id, patch);

    if (shouldRecordStatusChange(prev, patch.status)) {
      await deps.insertStatusEvent({
        application_id: existing.id,
        from_status: prev,
        to_status: patch.status,
        note: null,
      });
    }

    return updated;
  }

  const existing = await deps.fetchApplicationByJob(input.jobId);
  if (existing) {
    return updateExistingRow(existing);
  }

  const { data: created, error } = await deps.insertApplication({
    job_id: input.jobId,
    resume_id: input.resumeId ?? null,
    status,
    notes: input.notes ?? null,
  });

  if (error?.code === "23505") {
    const raced = await deps.fetchApplicationByJob(input.jobId);
    if (raced) {
      return updateExistingRow(raced);
    }
  }

  if (error || !created) {
    throw new Error(upsertInsertErrorMessage(error?.code));
  }

  await deps.insertStatusEvent({
    application_id: created.id,
    from_status: null,
    to_status: status,
    note: null,
  });

  return created;
}
