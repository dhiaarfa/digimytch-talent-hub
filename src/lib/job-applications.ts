import type {
  ApplicationStatus,
  Job,
  JobApplication,
  JobApplicationWithJob,
} from "@/lib/types";

/** Row shape from Supabase (includes soft-delete). */
export type JobApplicationRow = JobApplication & { deleted_at?: string | null };

export interface UpsertApplicationInput {
  jobId: string;
  resumeId?: string | null;
  status?: ApplicationStatus;
  notes?: string | null;
}

export function buildApplicationUpsertPatch(
  existing: Pick<JobApplication, "resume_id" | "status" | "notes"> & {
    deleted_at?: string | null;
  },
  input: UpsertApplicationInput
): {
  resume_id: string | null;
  status: ApplicationStatus;
  notes: string | null;
  deleted_at: null;
} {
  const status = input.status ?? "saved";
  return {
    resume_id: input.resumeId ?? existing.resume_id,
    status,
    notes: input.notes ?? existing.notes,
    deleted_at: null,
  };
}

export function shouldRecordStatusChange(prev: string, next: string): boolean {
  return prev !== next;
}

/** Only applications with a non-deleted job appear in Mes candidatures. */
export function joinApplicationsWithActiveJobs(
  applications: JobApplicationRow[],
  jobs: Job[]
): JobApplicationWithJob[] {
  const jobMap = new Map(jobs.map((j) => [j.id, j]));
  const result: JobApplicationWithJob[] = [];
  for (const app of applications) {
    if (app.deleted_at) continue;
    const job = jobMap.get(app.job_id);
    if (job) result.push({ ...app, job });
  }
  return result;
}

export function activeTrackedJobIds(
  applications: Pick<JobApplicationRow, "job_id" | "deleted_at">[]
): string[] {
  return applications.filter((a) => !a.deleted_at).map((a) => a.job_id);
}

export function upsertInsertErrorMessage(pgCode?: string): string {
  if (pgCode === "23505") {
    return "Cette offre est déjà dans vos candidatures.";
  }
  return "Création candidature impossible";
}

export function jobMissingForApplicationMessage(): string {
  return "Offre introuvable. Analysez l'offre à nouveau depuis Mes offres.";
}

/** Catalog / list: treat only active jobs as already owned. */
export function isCatalogJobOwned(
  ownedJobs: { company_name: string; position_title: string; deleted_at?: string | null }[],
  template: { company_name: string; position_title: string }
): boolean {
  const key = `${template.company_name}::${template.position_title}`.toLowerCase();
  return ownedJobs.some(
    (j) =>
      !j.deleted_at &&
      `${j.company_name}::${j.position_title}`.toLowerCase() === key
  );
}

export function findApplicationByJobId<T extends { job_id: string }>(
  rows: T[],
  jobId: string
): T | undefined {
  return rows.find((r) => r.job_id === jobId);
}

/** After soft-deleting a job, linked active applications should be hidden too. */
export function applicationIdsToCascadeOnJobDelete(
  applications: Pick<JobApplicationRow, "id" | "job_id" | "deleted_at">[],
  jobId: string
): string[] {
  return applications
    .filter((a) => a.job_id === jobId && !a.deleted_at)
    .map((a) => a.id);
}
