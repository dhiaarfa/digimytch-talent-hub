"use server";

import { upsertJobApplication } from "@/utils/actions/applications/actions";

export async function trackJobApplicationAction(formData: FormData) {
  const jobId = formData.get("jobId");
  if (typeof jobId !== "string" || !jobId) return;
  await upsertJobApplication({ jobId, status: "saved" });
}
