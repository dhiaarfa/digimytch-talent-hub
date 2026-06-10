import { generateObject } from "ai";
import type { LanguageModelV1 } from "ai";
import type { Resume } from "@/lib/types";
import type { AIConfig } from "@/utils/ai-tools";
import { runTrackedAIRequest } from "@/lib/ai/run-tracked-request";
import { withAITimeout, AITimeoutError } from "@/lib/ai/with-timeout";
import {
  getDigimytchModelFallbackChain,
  isOpenRouterModelNotFoundError,
  isStructuredOutputFailure,
  selectDigimytchModelForTask,
} from "@/lib/digimytch-openrouter-models";
import { isDigimytchTalentHub } from "@/lib/digimytch-config";
import { resumeScoreSchema, type ResumeScoreMetrics } from "@/lib/zod-schemas";
import {
  buildCompactJobScoreText,
  buildCompactResumeScoreText,
} from "@/lib/resume-score-prompt";
import type { JobScoringInput } from "@/lib/resume-score-heuristic";
import { logger } from "@/lib/logger";

const SCORE_MODEL_TIMEOUT_MS = 18_000;
export const SCORE_TOTAL_BUDGET_MS = 42_000;
const SCORE_MAX_MODEL_ATTEMPTS = 3;

function buildScorePrompt(
  resume: Resume,
  job: JobScoringInput | null,
  isTailoredResume: boolean
): string {
  const resumeText = buildCompactResumeScoreText(resume);
  let prompt = `Analyze this resume and score it (0-100 per metric). Resume:\n${resumeText}`;

  if (isTailoredResume && job) {
    prompt += `\n\nJob context:\n${buildCompactJobScoreText(job)}`;
    prompt += `
This is a TAILORED resume for this job. Include jobAlignment and jobSpecificImprovements. Set isTailoredResume true.`;
  } else {
    prompt += `
This is a base resume (not job-specific). Set isTailoredResume false. Omit jobAlignment.`;
  }

  prompt += `
Include miscellaneous with 2-3 extra metrics (keywordOptimization, atsReadability, etc.).
All reason fields: short French sentences.`;

  return prompt;
}

const scoreSystem = `You are a professional resume analyst for Digimytch Talent Hub.
Respond ONLY with valid JSON matching the required schema exactly.
All scores must be integers from 0 to 100.
Do not wrap JSON in markdown code fences.`;

function shouldTryNextModel(error: unknown): boolean {
  if (error instanceof AITimeoutError) return true;
  if (isDigimytchTalentHub()) {
    return (
      isOpenRouterModelNotFoundError(error) || isStructuredOutputFailure(error)
    );
  }
  return false;
}

export async function generateResumeScoreWithAI(
  resume: Resume,
  job: JobScoringInput | null,
  config: AIConfig,
  input: { userId: string; isPro: boolean }
): Promise<ResumeScoreMetrics> {
  const isTailoredResume = Boolean(job && !resume.is_base_resume);
  const prompt = buildScorePrompt(resume, job, isTailoredResume);

  const preferred =
    config.model?.trim() ||
    (isDigimytchTalentHub() ? selectDigimytchModelForTask("cv") : "");

  const chain = (
    isDigimytchTalentHub()
      ? getDigimytchModelFallbackChain(preferred)
      : [preferred].filter(Boolean)
  ).slice(0, SCORE_MAX_MODEL_ATTEMPTS);

  const modelsToTry = chain.length > 0 ? chain : ["openrouter/free"];

  const started = Date.now();
  let lastError: unknown;

  for (let i = 0; i < modelsToTry.length; i++) {
    if (Date.now() - started > SCORE_TOTAL_BUDGET_MS) {
      throw new AITimeoutError("Total scoring budget exceeded");
    }

    const modelId = modelsToTry[i];
    const remaining = SCORE_TOTAL_BUDGET_MS - (Date.now() - started);
    const timeout = Math.min(SCORE_MODEL_TIMEOUT_MS, Math.max(5_000, remaining));

    try {
      const { object } = await withAITimeout(
        runTrackedAIRequest(
          {
            route:
              i === 0
                ? "actions.resumes.generateResumeScore"
                : "actions.resumes.generateResumeScore.model_fallback",
            userId: input.userId,
            isPro: input.isPro,
            config: { model: modelId, apiKeys: config.apiKeys ?? [] },
          },
          (aiClient) =>
            generateObject({
              model: aiClient as LanguageModelV1,
              schema: resumeScoreSchema,
              system: scoreSystem,
              prompt,
              temperature: 0.3,
              maxRetries: 1,
            })
        ),
        timeout,
        "generateResumeScore"
      );
      if (i > 0) {
        logger.warn(`[generateResumeScore] succeeded with fallback model ${modelId}`);
      }
      return object;
    } catch (error) {
      lastError = error;
      const canRetry = i < modelsToTry.length - 1 && shouldTryNextModel(error);
      if (canRetry) {
        logger.warn(
          `[generateResumeScore] model ${modelId} failed: ${error instanceof Error ? error.message : "error"}`
        );
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("Resume scoring failed");
}
