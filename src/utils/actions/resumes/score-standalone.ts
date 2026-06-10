"use server";

import { createClient } from "@/utils/supabase/server";
import {
  jobFromPostingText,
  resumeFromCvText,
  scoringStorageKey,
} from "@/lib/cv-scoring-context";
import type { Job, Resume, ResumeSummary } from "@/lib/types";
import { getResumeById } from "@/utils/actions/resumes/actions";

export type CvScoringBundle = {
  resume: Resume;
  job: Job | null;
  storageKey: string;
};

export async function listBaseResumesForScoring(): Promise<ResumeSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Non authentifié");

  const { data, error: qErr } = await supabase
    .from("resumes")
    .select(
      "id, user_id, name, target_role, is_base_resume, has_cover_letter, created_at, updated_at, job_id"
    )
    .eq("user_id", user.id)
    .eq("is_base_resume", true)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (qErr) throw new Error("Impossible de charger vos CV.");
  return (data ?? []) as ResumeSummary[];
}

export async function loadResumeScoringBundle(resumeId: string): Promise<CvScoringBundle> {
  const { resume, job } = await getResumeById(resumeId);
  return { resume, job, storageKey: resumeId };
}

export async function loadImportedCvScoringBundle(input: {
  cvText: string;
  targetRole?: string;
  jobText?: string;
}): Promise<CvScoringBundle> {
  const cvText = input.cvText?.trim() ?? "";
  if (cvText.length < 80) {
    throw new Error("Collez au moins 80 caractères de votre CV pour l'analyse.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Non authentifié");

  const jobText = input.jobText?.trim() ?? "";
  const storageKey = scoringStorageKey({ cvText, jobText: jobText || undefined });
  const job = jobText.length >= 40 ? jobFromPostingText(jobText, user.id) : null;

  const resume = resumeFromCvText(cvText, user.id, {
    targetRole: input.targetRole,
    storageId: storageKey,
    withJobContext: Boolean(job),
  });

  return { resume, job, storageKey };
}
