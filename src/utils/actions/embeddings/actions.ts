"use server";

import { createClient } from "@/utils/supabase/server";
import { buildJobEmbeddingText, buildResumeEmbeddingText } from "@/lib/embeddings-text";
import { formatEmbeddingForPg, generateEmbedding } from "@/lib/embeddings";
import type { Job, Resume } from "@/lib/types";
import { logger } from "@/lib/logger";

async function storeJobEmbedding(jobId: string, userId: string, vector: number[]) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ embedding: formatEmbeddingForPg(vector) })
    .eq("id", jobId)
    .eq("user_id", userId);
  if (error) throw error;
}

async function storeResumeEmbedding(resumeId: string, userId: string, vector: number[]) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("resumes")
    .update({ embedding: formatEmbeddingForPg(vector) })
    .eq("id", resumeId)
    .eq("user_id", userId);
  if (error) throw error;
}

/** Génère et persiste l'embedding d'une offre si absent. */
export async function ensureJobEmbedding(jobId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return false;

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, user_id, position_title, description, keywords, embedding")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !job) return false;
  if (job.embedding) return true;

  try {
    const text = buildJobEmbeddingText(job as unknown as Job);
    const vector = await generateEmbedding(text);
    await storeJobEmbedding(jobId, user.id, vector);
    return true;
  } catch (e) {
    logger.error("[ensureJobEmbedding]", e);
    return false;
  }
}

/** Génère et persiste l'embedding d'un CV si absent. */
export async function ensureResumeEmbedding(resumeId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return false;

  const { data: resume, error } = await supabase
    .from("resumes")
    .select(
      "id, user_id, target_role, professional_summary, skills, work_experience, embedding"
    )
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !resume) return false;
  if (resume.embedding) return true;

  try {
    const text = buildResumeEmbeddingText(resume as unknown as Resume);
    const vector = await generateEmbedding(text);
    await storeResumeEmbedding(resumeId, user.id, vector);
    return true;
  } catch (e) {
    logger.error("[ensureResumeEmbedding]", e);
    return false;
  }
}

/** File d'attente non bloquante après sauvegarde d'une offre. */
export async function queueJobEmbedding(jobId: string): Promise<void> {
  void ensureJobEmbedding(jobId).catch((e) => logger.warn("[queueJobEmbedding]", e));
}

/** File d'attente non bloquante après sauvegarde d'un CV. */
export async function queueResumeEmbedding(resumeId: string): Promise<void> {
  void ensureResumeEmbedding(resumeId).catch((e) => logger.warn("[queueResumeEmbedding]", e));
}
