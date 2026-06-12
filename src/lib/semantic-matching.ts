import { createClient } from "@/utils/supabase/server";
import {
  applyHybridToMatch,
  blendHybridScore,
  collectResumeSkillTokens,
  computeResumeJobMatch,
} from "@/lib/matching";
import { ensureJobEmbedding, ensureResumeEmbedding } from "@/utils/actions/embeddings/actions";
import type { Job, JobMatchResult, Resume } from "@/lib/types";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { logger } from "@/lib/logger";

export { blendHybridScore };

export interface HybridMatchResult {
  score: number;
  semanticSimilarity: number | null;
  deterministicScore: number;
  match: JobMatchResult;
}

async function fetchSemanticSimilarity(
  jobId: string,
  resumeId: string
): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("job_resume_semantic_similarity", {
    p_job_id: jobId,
    p_resume_id: resumeId,
  });

  if (error) {
    logger.warn("[hybridMatchScore] rpc", error.message);
    return null;
  }

  if (data == null || typeof data !== "number") return null;
  return Math.max(0, Math.min(1, data));
}

/**
 * Score hybride pour une paire CV / offre (sémantique pgvector + mots-clés).
 * Génère les embeddings à la volée si absents.
 */
export async function hybridMatchScore(
  resumeId: string,
  jobId: string,
  options?: { tokenOverride?: Set<string> }
): Promise<HybridMatchResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Non authentifié");

  const [{ data: resumeRow }, { data: jobRow }] = await Promise.all([
    supabase
      .from("resumes")
      .select(
        "id, user_id, name, target_role, is_base_resume, job_id, skills, work_experience, education, email, phone_number, first_name, last_name, professional_summary, projects"
      )
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("jobs")
      .select(
        "id, user_id, company_name, position_title, job_url, description, location, salary_range, keywords, work_location, employment_type, created_at, updated_at, is_active"
      )
      .eq("id", jobId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  if (!resumeRow || !jobRow) {
    throw new Error("CV ou offre introuvable");
  }

  const resume = resumeRow as unknown as Resume;
  const job = jobRow as Job;
  const deterministic = computeResumeJobMatch(resume, job, {
    tokenOverride: options?.tokenOverride,
  });

  await Promise.all([
    ensureResumeEmbedding(resumeId),
    ensureJobEmbedding(jobId),
  ]);

  const semantic = await fetchSemanticSimilarity(jobId, resumeId);
  const match = applyHybridToMatch(deterministic, semantic);

  return {
    score: match.score,
    semanticSimilarity: semantic,
    deterministicScore: deterministic.score,
    match,
  };
}

/** Carte job_id → similarité cosinus pour toutes les offres actives d'un utilisateur. */
export async function fetchSemanticSimilarityMap(
  userId: string,
  resumeEmbedding: string
): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("match_jobs_semantic", {
    p_user_id: userId,
    p_resume_embedding: resumeEmbedding,
    p_match_threshold: 0,
    p_match_count: 100,
  });

  const map = new Map<string, number>();
  if (error) {
    logger.warn("[fetchSemanticSimilarityMap]", error.message);
    return map;
  }

  for (const row of data ?? []) {
    const jobId = row.job_id as string;
    const sim = row.similarity as number;
    if (jobId && typeof sim === "number") map.set(jobId, sim);
  }
  return map;
}

export async function buildDigimytchTokenOverride(
  userId: string
): Promise<Set<string> | undefined> {
  if (!IS_DIGIMYTCH_TALENT_HUB) return undefined;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("resumes")
    .select("skills, work_experience, education, target_role, projects")
    .eq("user_id", userId)
    .eq("is_base_resume", true)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(3);

  if (!rows || rows.length <= 1) return undefined;

  const merged = new Set<string>();
  for (const r of rows) {
    for (const t of collectResumeSkillTokens(r as unknown as Resume)) merged.add(t);
  }
  return merged;
}
