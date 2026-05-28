import { createHash } from "node:crypto";

export function hashJobListing(job: {
  position_title: string;
  company_name: string;
  description?: string | null;
  keywords?: string[] | null;
}): string {
  const normalized = [
    job.position_title?.trim().toLowerCase() ?? "",
    job.company_name?.trim().toLowerCase() ?? "",
    (job.description ?? "").trim().toLowerCase(),
    ...(job.keywords ?? []).map((k) => String(k).trim().toLowerCase()).sort().join("|"),
  ].join("::");
  return createHash("sha256").update(normalized).digest("hex");
}
