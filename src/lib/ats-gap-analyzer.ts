import { generateObject } from "ai";
import type { LanguageModelV1 } from "ai";
import type { AIConfig } from "@/utils/ai-tools";
import { runTrackedAIRequest } from "@/lib/ai/run-tracked-request";
import { withAITimeout, AITimeoutError } from "@/lib/ai/with-timeout";
import {
  getDigimytchModelFallbackChain,
  isOpenRouterModelNotFoundError,
  isStructuredOutputFailure,
} from "@/lib/digimytch-openrouter-models";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { sanitizeForPrompt } from "@/lib/prompt-security";
import { logger } from "@/lib/logger";
import { buildAtsCvTextForPrompt, type AtsCvContent } from "@/lib/ats-gap-cv";
import { atsGapAnalysisSchema, type AtsGapAnalysis } from "@/lib/ats-gap-schema";
import { ATS_GAP_MODEL } from "@/lib/ats-gap-constants";
const MODEL_TIMEOUT_MS = 22_000;
const TOTAL_BUDGET_MS = 50_000;
const MAX_MODEL_ATTEMPTS = 4;

const ATS_SYSTEM = `Tu es un expert ATS (Applicant Tracking System) pour Digimytch Talent Hub.
Analyse la compatibilité sémantique entre un CV et une offre d'emploi.

Règles:
- Extrais 12 à 25 mots-clés prioritaires de l'offre (compétences techniques, outils, soft skills, certifications).
- Vérifie la présence de chaque mot-clé dans les sections du CV: summary (résumé/poste visé), experience (expériences + 1er bullet), skills, education.
- Objectif ATS: 60–80 % de couverture des mots-clés critiques.
- Les zones prioritaires: titre/poste, résumé, compétences, premier bullet de chaque expérience.
- Réponds UNIQUEMENT en JSON valide conforme au schéma. Pas de markdown.
- Libellés des mots-clés en français si l'offre est en français, sinon reprends le terme exact de l'offre.`;

function shouldTryNextModel(error: unknown): boolean {
  if (error instanceof AITimeoutError) return true;
  if (IS_DIGIMYTCH_TALENT_HUB) {
    return isOpenRouterModelNotFoundError(error) || isStructuredOutputFailure(error);
  }
  return false;
}

function buildAtsGapPrompt(cvContent: AtsCvContent, jobDescription: string): string {
  const cvText = buildAtsCvTextForPrompt(cvContent);
  const jobSanitized = sanitizeForPrompt(jobDescription);

  return `OFFRE D'EMPLOI:
${jobSanitized.text}

CV (sections structurées):
${cvText}

Calcule:
- overall_ats_score (0-100): couverture globale des mots-clés prioritaires.
- sections.summary / experience / skills: score 0-100, present[], missing[].
- sections.education: score 0-100, missing[] (pas de present).
- critical_missing: mots-clés de l'offre absents de TOUT le CV.
- quick_wins: exactement 3 mots-clés faciles à ajouter pour gagner des points rapidement.`;
}

export async function analyzeAtsKeywordGap(
  cvContent: AtsCvContent,
  jobDescription: string,
  config: AIConfig,
  input: { userId: string; isPro: boolean }
): Promise<AtsGapAnalysis> {
  const prompt = buildAtsGapPrompt(cvContent, jobDescription);

  const preferred =
    config.model?.trim() ||
    (IS_DIGIMYTCH_TALENT_HUB ? ATS_GAP_MODEL : "openrouter/free");

  const chain = (
    IS_DIGIMYTCH_TALENT_HUB
      ? getDigimytchModelFallbackChain(preferred)
      : [preferred].filter(Boolean)
  ).slice(0, MAX_MODEL_ATTEMPTS);

  const modelsToTry = chain.length > 0 ? chain : [ATS_GAP_MODEL];
  const started = Date.now();
  let lastError: unknown;

  for (let i = 0; i < modelsToTry.length; i++) {
    if (Date.now() - started > TOTAL_BUDGET_MS) {
      throw new AITimeoutError("Délai d'analyse ATS dépassé");
    }

    const modelId = modelsToTry[i];
    const remaining = TOTAL_BUDGET_MS - (Date.now() - started);
    const timeout = Math.min(MODEL_TIMEOUT_MS, Math.max(6_000, remaining));

    try {
      const { object } = await withAITimeout(
        runTrackedAIRequest(
          {
            route:
              i === 0 ? "api.cv.ats-gap" : "api.cv.ats-gap.model_fallback",
            userId: input.userId,
            isPro: input.isPro,
            config: { model: modelId, apiKeys: config.apiKeys ?? [] },
          },
          (aiClient) =>
            generateObject({
              model: aiClient as LanguageModelV1,
              schema: atsGapAnalysisSchema,
              system: ATS_SYSTEM,
              prompt,
              temperature: 0.2,
              maxRetries: 1,
            })
        ),
        timeout,
        "analyzeAtsKeywordGap"
      );

      const parsed = atsGapAnalysisSchema.safeParse(object);
      if (!parsed.success) {
        throw new Error("Réponse IA invalide (schéma ATS)");
      }

      if (i > 0) {
        logger.warn(`[ats-gap] succeeded with fallback model ${modelId}`);
      }

      return {
        ...parsed.data,
        quick_wins: parsed.data.quick_wins.slice(0, 3),
      };
    } catch (error) {
      lastError = error;
      const canRetry = i < modelsToTry.length - 1 && shouldTryNextModel(error);
      if (canRetry) {
        logger.warn(
          `[ats-gap] model ${modelId} failed: ${error instanceof Error ? error.message : "error"}`
        );
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("Analyse ATS impossible");
}
