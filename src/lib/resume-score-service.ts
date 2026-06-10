import type { Job, Resume } from "@/lib/types";
import type { AIConfig } from "@/utils/ai-tools";
import type { ResumeScoreMetrics } from "@/lib/zod-schemas";
import { getAIPlanState, resolveTaskModel } from "@/lib/ai/plan";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { buildHeuristicResumeScore } from "@/lib/resume-score-heuristic";
import type { JobScoringInput } from "@/lib/resume-score-heuristic";
import { generateResumeScoreWithAI } from "@/lib/resume-score-ai";
import { isLocalDevMockAI } from "@/lib/ai/ci-mock-model";
import { logPromptInjectionAttempt } from "@/lib/ai/usage-ledger";
import { sanitizeUnknownForPrompt } from "@/lib/prompt-security";
import { logger } from "@/lib/logger";
import { toJsonSafeScore } from "@/lib/resume-score-payload";

function toJobForScoring(job: Job | null | undefined): JobScoringInput | null {
  if (!job) return null;
  return {
    company_name: job.company_name,
    position_title: job.position_title,
    description: job.description,
    keywords: job.keywords,
  };
}

export type ResumeScoreResult = {
  score: ResumeScoreMetrics;
  source: "ai" | "heuristic" | "mock";
};

export async function computeResumeScore(
  resume: Resume,
  job?: Job | null,
  config?: AIConfig
): Promise<ResumeScoreResult> {
  const { isPro, userId } = await getAIPlanState();
  const resolvedConfig: AIConfig = {
    model: resolveTaskModel("cv", isPro, config?.model),
    apiKeys: config?.apiKeys ?? [],
  };

  const jobForScoring = toJobForScoring(job);

  if (isLocalDevMockAI()) {
    return {
      score: toJsonSafeScore(buildHeuristicResumeScore(resume, jobForScoring)),
      source: "mock",
    };
  }

  const resumeForScoring = {
    target_role: resume.target_role,
    is_base_resume: resume.is_base_resume,
    work_experience: resume.work_experience,
    education: resume.education,
    skills: resume.skills,
    projects: resume.projects,
    first_name: resume.first_name,
    last_name: resume.last_name,
    email: resume.email,
    phone_number: resume.phone_number,
    location: resume.location,
  };

  try {
    const sanitizedResume = sanitizeUnknownForPrompt(resumeForScoring);
    const sanitizedJob = sanitizeUnknownForPrompt(jobForScoring);
    if (
      sanitizedResume.detected ||
      sanitizedResume.wasTrimmed ||
      sanitizedJob.detected ||
      sanitizedJob.wasTrimmed
    ) {
      await logPromptInjectionAttempt({
        userId,
        route: "resume.computeResumeScore",
        details: `resume_removed=${sanitizedResume.removedFragments},job_removed=${sanitizedJob.removedFragments}`,
      });
    }

    const score = await generateResumeScoreWithAI(
      resume,
      jobForScoring,
      resolvedConfig,
      { userId, isPro }
    );
    return { score: toJsonSafeScore(score), source: "ai" };
  } catch (error) {
    logger.error("Error SCORING resume:", error);

    if (IS_DIGIMYTCH_TALENT_HUB) {
      logger.warn("[computeResumeScore] Using heuristic score fallback");
      return {
        score: toJsonSafeScore(buildHeuristicResumeScore(resume, jobForScoring)),
        source: "heuristic",
      };
    }

    throw error;
  }
}
