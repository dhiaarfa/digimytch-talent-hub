import type { Job } from "@/lib/types";
import { simplifiedJobSchema } from "@/lib/zod-schemas";
import type { z } from "zod";

export type SimplifiedJobListing = z.infer<typeof simplifiedJobSchema>;

export function jobToSimplifiedListing(job: Job): SimplifiedJobListing {
  return {
    company_name: job.company_name,
    position_title: job.position_title,
    job_url: job.job_url,
    description: job.description,
    location: job.location,
    salary_range: job.salary_range,
    keywords: job.keywords ?? [],
    work_location: job.work_location ?? "in_person",
    employment_type: job.employment_type ?? "full_time",
    is_active: job.is_active,
  };
}

export function jobToDescriptionText(job: Job): string {
  return [
    job.position_title,
    job.company_name ? `Entreprise : ${job.company_name}` : "",
    job.location ? `Lieu : ${job.location}` : "",
    job.description ?? "",
    job.keywords?.length ? `Mots-clés : ${job.keywords.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
