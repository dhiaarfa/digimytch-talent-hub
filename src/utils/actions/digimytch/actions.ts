"use server";

import { isDigimytchTalentHub } from "@/lib/digimytch-config";
import { createClient } from "@/utils/supabase/server";
import { collectResumeSkillTokens, computeResumeJobMatch } from "@/lib/matching";
import { listCourses } from "@/utils/actions/courses/actions";
import { rankCoursesBySkillGaps } from "@/lib/course-ranking";
import type { Job, JobMatchResult, Resume } from "@/lib/types";
import { getCachedJobsWithMatch } from "@/lib/digimytch-queries";
import { ensureDemoJobsIfEmpty } from "@/utils/actions/digimytch/seed-demo-jobs";

export interface JobWithMatch {
  job: Job;
  match: JobMatchResult;
}

export async function getJobsWithMatchScores(): Promise<{
  resume: Resume | null;
  jobsWithMatch: JobWithMatch[];
}> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Non authentifié");
  }

  await ensureDemoJobsIfEmpty().catch(() => {
    /* démo optionnelle */
  });

  const { data: resumeRows } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_base_resume", true)
    .order("updated_at", { ascending: false });

  const bases = (resumeRows ?? []) as Resume[];
  const resumeRow = bases[0] ?? null;

  const mergeDigimytch =
    isDigimytchTalentHub() && bases.length > 1 ? (() => {
      const merged = new Set<string>();
      for (const r of bases) {
        for (const t of collectResumeSkillTokens(r)) merged.add(t);
      }
      return merged;
    })() : undefined;

  const { data: jobRows, error: jobErr } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (jobErr) {
    console.error("[getJobsWithMatchScores] jobs", jobErr);
    throw new Error("Impossible de charger les offres.");
  }

  const jobs = (jobRows ?? []) as Job[];

  if (!resumeRow) {
    return {
      resume: null,
      jobsWithMatch: jobs.map((job) => ({
        job,
        match: {
          score: 0,
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
