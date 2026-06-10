"use server";

import { upsertJobApplication } from "@/utils/actions/applications/actions";

export async function trackJobApplicationAction(
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const jobId = formData.get("jobId");
  if (typeof jobId !== "string" || !jobId) {
    return { ok: false, error: "Identifiant d'offre manquant." };
  }
  try {
    await upsertJobApplication({ jobId, status: "saved" });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Impossible d'ajouter la candidature.";
    return { ok: false, error: msg };
  }
}
