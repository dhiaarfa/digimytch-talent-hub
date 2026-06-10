import type { Job, Resume } from "@/lib/types";
import type { ResumeScoreMetrics } from "@/lib/zod-schemas";

/** Remove fields that break Server Action / JSON serialization or bloat payloads. */
export function stripResumeForScoring(resume: Resume): Resume {
  const rest = { ...resume };
  delete rest.section_configs;
  delete rest.section_order;
  delete rest.cover_letter;
  delete rest.document_settings;
  return rest;
}

export function stripJobForScoring(job?: Job | null): Job | null {
  if (!job) return null;
  const row = { ...job };
  if (row.employment_type == null) {
    delete (row as { employment_type?: string }).employment_type;
  }
  return row;
}

/** Plain JSON-safe clone for API responses and Server Actions. */
export function toJsonSafeScore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isHeuristicScoreMetrics(metrics: ResumeScoreMetrics): boolean {
  const reason = metrics.overallScore?.reason ?? "";
  return (
    reason.includes("Score calculé localement") ||
    reason.includes("Estimation locale")
  );
}
