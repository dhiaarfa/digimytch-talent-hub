"use server";
import { logger } from '@/lib/logger';

import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { createClient } from "@/utils/supabase/server";
import { applyHybridToMatch, collectResumeSkillTokens, computeResumeJobMatch } from "@/lib/matching";
import { fetchSemanticSimilarityMap } from "@/lib/semantic-matching";
import { ensureJobEmbedding } from "@/utils/actions/embeddings/actions";
import { formatEmbeddingForPg } from "@/lib/embeddings";
import { buildResumeEmbeddingText } from "@/lib/embeddings-text";
import { generateEmbedding } from "@/lib/embeddings";
import { listCourses } from "@/utils/actions/courses/actions";
import { rankCoursesBySkillGaps } from "@/lib/course-ranking";
import type { Job, JobMatchResult, Resume } from "@/lib/types";
import { getCachedJobsWithMatch } from "@/lib/digimytch-queries";
import { getCachedAuthUser } from "@/lib/server-auth";

export interface JobWithMatch {
  job: Job;
  match: JobMatchResult;
}

export async function getJobsWithMatchScores(): Promise<{
  resume: Resume | null;
  jobsWithMatch: JobWithMatch[];
}> {
  const { user } = await getCachedAuthUser();
  if (!user) {
    throw new Error("Non authentifié");
  }

  const supabase = await createClient();

  const { data: resumeRows } = await supabase
    .from("resumes")
    .select(
      "id, user_id, name, target_role, is_base_resume, job_id, skills, work_experience, education, email, phone_number, first_name, last_name, professional_summary, projects"
    )
    .eq("user_id", user.id)
    .eq("is_base_resume", true)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(3);

  const bases = (resumeRows ?? []) as unknown as Resume[];
  const resumeRow = bases[0] ?? null;

  const mergeDigimytch =
    IS_DIGIMYTCH_TALENT_HUB && bases.length > 1 ? (() => {
      const merged = new Set<string>();
      for (const r of bases) {
        for (const t of collectResumeSkillTokens(r)) merged.add(t);
      }
      return merged;
    })() : undefined;

  const { data: jobRows, error: jobErr } = await supabase
    .from("jobs")
    .select("id, user_id, company_name, position_title, job_url, description, location, salary_range, keywords, work_location, employment_type, created_at, updated_at, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(40);

  if (jobErr) {
    logger.error("[getJobsWithMatchScores] jobs", jobErr);
    throw new Error("Impossible de charger les offres.");
  }

  const jobs = (jobRows ?? []) as Job[];

  if (!resumeRow) {
    return {
      resume: null,
      jobsWithMatch: jobs.map((job) => ({
        job,
        match: {
          score: -1, // -1 = no CV (never show as 0/100)
          matchedKeywords: [],
          missingKeywords: job.keywords ?? [],
          matchedSkills: [],
          gapSkills: job.keywords ?? [],
        },
      })),
    };
  }

  const resume = resumeRow as unknown as Resume;
  const jobsWithMatch = jobs.map((job) => ({
    job,
    match: computeResumeJobMatch(resume, job, {
      tokenOverride: mergeDigimytch,
    }),
  }));

  jobsWithMatch.sort((a, b) => b.match.score - a.match.score);

  return { resume, jobsWithMatch };
}

/** Matching hybride (pgvector + mots-clés) pour la page /jobs. */
export async function getHybridJobsWithMatchScores(): Promise<{
  resume: Resume | null;
  jobsWithMatch: JobWithMatch[];
}> {
  const base = await getJobsWithMatchScores();
  if (!base.resume) return base;

  const { user } = await getCachedAuthUser();
  if (!user) throw new Error("Non authentifié");

  const resume = base.resume;

  await Promise.all(
    base.jobsWithMatch.map(({ job }) => ensureJobEmbedding(job.id))
  );

  const supabase = await createClient();
  let semanticMap = new Map<string, number>();

  const { data: resumeEmbRow } = await supabase
    .from("resumes")
    .select("embedding")
    .eq("id", resume.id)
    .maybeSingle();

  let resumeEmbedding = resumeEmbRow?.embedding as string | null;

  if (!resumeEmbedding) {
    try {
      const vector = await generateEmbedding(buildResumeEmbeddingText(resume));
      resumeEmbedding = formatEmbeddingForPg(vector);
      await supabase
        .from("resumes")
        .update({ embedding: resumeEmbedding })
        .eq("id", resume.id)
        .eq("user_id", user.id);
    } catch (e) {
      logger.warn("[getHybridJobsWithMatchScores] resume embedding", e);
    }
  }

  if (resumeEmbedding) {
    semanticMap = await fetchSemanticSimilarityMap(user.id, resumeEmbedding);
  }

  const jobsWithMatch = base.jobsWithMatch.map(({ job, match }) => {
    const semantic = semanticMap.get(job.id) ?? null;
    return { job, match: applyHybridToMatch(match, semantic) };
  });

  jobsWithMatch.sort((a, b) => b.match.score - a.match.score);
  return { resume, jobsWithMatch };
}

export async function getFormationHubData(): Promise<{
  courses: Awaited<ReturnType<typeof listCourses>>;
  ranked: ReturnType<typeof rankCoursesBySkillGaps>;
  gapUnion: string[];
}> {
  const courses = await listCourses();
  const { jobsWithMatch, resume } = await getCachedJobsWithMatch();

  const gapUnion = new Set<string>();
  if (resume) {
    for (const { match } of jobsWithMatch.slice(0, 8)) {
      match.gapSkills.forEach((g) => gapUnion.add(g));
    }
  }

  const gaps = [...gapUnion];
  const ranked = rankCoursesBySkillGaps(courses, gaps);
  return { courses, ranked, gapUnion: gaps };
}
