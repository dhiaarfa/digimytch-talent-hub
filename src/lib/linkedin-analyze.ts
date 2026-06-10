import { generateObject, generateText } from "ai";
import type { LanguageModelV1 } from "ai";
import { z } from "zod";
import {
  getDigimytchModelFallbackChain,
  isOpenRouterModelNotFoundError,
  isOpenRouterRateLimitError,
  isStructuredOutputFailure,
  selectDigimytchModelForTask,
} from "@/lib/digimytch-openrouter-models";
import { runTrackedAIRequest } from "@/lib/ai/run-tracked-request";
import { buildHeuristicLinkedInReport } from "@/lib/linkedin-report-heuristic";
import { logger } from "@/lib/logger";

export const linkedInReportSchema = z.object({
  name: z.string().nullable(),
  headline: z.string(),
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(
    z.object({
      priority: z.string(),
      action: z.string(),
      why: z.string(),
    })
  ),
  cvImportTips: z.array(z.string()),
  keywords: z.array(z.string()),
});

export type LinkedInReport = z.infer<typeof linkedInReportSchema>;

const VISION_MODELS = [
  "openrouter/free",
  "google/gemma-4-26b-a4b-it:free",
  "moonshotai/kimi-k2.6:free",
] as const;

const LINKEDIN_OCR_PROMPT = `Extract ALL visible text from this LinkedIn profile screenshot.
Include: name, headline, location, about/summary, experience (titles, companies, dates), education, skills, certifications.
Return plain text only — no commentary. Preserve line breaks between sections.`;

const JSON_SCHEMA_HINT = `Return ONLY valid JSON matching this shape (no markdown):
{"name":string|null,"headline":string,"score":number,"strengths":string[],"weaknesses":string[],"recommendations":[{"priority":string,"action":string,"why":string}],"cvImportTips":string[],"keywords":string[]}`;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildAnalysisPrompt(ocrOrHint: string, isFr: boolean): string {
  return isFr
    ? `Analyse ce profil LinkedIn (texte extrait d'une capture) pour un candidat en Tunisie. Sois concret et actionnable.

Texte du profil :
---
${ocrOrHint.slice(0, 12_000)}
---`
    : `Analyze this LinkedIn profile text (from a screenshot) for a job seeker in Tunisia. Be concrete and actionable.

Profile text:
---
${ocrOrHint.slice(0, 12_000)}
---`;
}

function parseJsonReport(raw: string): LinkedInReport | null {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    const result = linkedInReportSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

async function generateReportFromText(input: {
  userId: string;
  isPro: boolean;
  route: string;
  prompt: string;
  preferredModel?: string;
}): Promise<LinkedInReport | null> {
  const chain = getDigimytchModelFallbackChain(
    input.preferredModel ?? selectDigimytchModelForTask("linkedin")
  );

  for (let i = 0; i < chain.length; i++) {
    const modelId = chain[i];
    try {
      const { object } = await runTrackedAIRequest(
        {
          route: i === 0 ? input.route : `${input.route}.fallback`,
          userId: input.userId,
          isPro: input.isPro,
          config: { model: modelId, apiKeys: [] },
        },
        (model) =>
          generateObject({
            model: model as LanguageModelV1,
            schema: linkedInReportSchema,
            maxRetries: 1,
            prompt: input.prompt,
            maxTokens: 2200,
          })
      );
      return object;
    } catch (error) {
      const canContinue =
        i < chain.length - 1 &&
        (isOpenRouterModelNotFoundError(error) || isStructuredOutputFailure(error));
      if (canContinue) {
        if (isOpenRouterRateLimitError(error)) await sleep(2500 * (i + 1));
        continue;
      }
      logger.warn(`[linkedin] generateObject failed on ${modelId}`, error);
    }
  }

  const jsonPrompt = `${input.prompt}\n\n${JSON_SCHEMA_HINT}`;
  for (let i = 0; i < Math.min(3, chain.length); i++) {
    const modelId = chain[i];
    try {
      const { text } = await runTrackedAIRequest(
        {
          route: `${input.route}.json_text`,
          userId: input.userId,
          isPro: input.isPro,
          config: { model: modelId, apiKeys: [] },
        },
        (model) =>
          generateText({
            model: model as LanguageModelV1,
            maxRetries: 0,
            prompt: jsonPrompt,
            maxTokens: 2200,
          })
      );
      const parsed = parseJsonReport(text);
      if (parsed) return parsed;
    } catch {
      /* try next */
    }
  }

  return null;
}

async function runVisionAnalysis(input: {
  userId: string;
  isPro: boolean;
  imageUrl: string;
  isFr: boolean;
}): Promise<LinkedInReport | null> {
  const prompt = input.isFr
    ? "Analyse cette capture d'écran de profil LinkedIn. Rapport complet pour un candidat en Tunisie."
    : "Analyze this LinkedIn profile screenshot. Full report for a job seeker in Tunisia.";

  for (let i = 0; i < VISION_MODELS.length; i++) {
    const modelId = VISION_MODELS[i];
    try {
      const { object } = await runTrackedAIRequest(
        {
          route: i === 0 ? "api.linkedin-analyze" : "api.linkedin-analyze.vision_fallback",
          userId: input.userId,
          isPro: input.isPro,
          config: { model: modelId, apiKeys: [] },
        },
        (model) =>
          generateObject({
            model: model as LanguageModelV1,
            schema: linkedInReportSchema,
            maxRetries: 1,
            messages: [
              {
                role: "user",
                content: [
                  { type: "image", image: input.imageUrl },
                  { type: "text", text: prompt },
                ],
              },
            ],
            maxTokens: 2200,
          })
      );
      return object;
    } catch (error) {
      const canContinue =
        i < VISION_MODELS.length - 1 &&
        (isOpenRouterModelNotFoundError(error) || isStructuredOutputFailure(error));
      if (canContinue) {
        if (isOpenRouterRateLimitError(error)) await sleep(3000);
        continue;
      }
      if (!isStructuredOutputFailure(error) && !isOpenRouterModelNotFoundError(error)) {
        logger.warn("[linkedin] vision analysis error", error);
      }
    }
  }
  return null;
}

async function extractLinkedInTextFromImage(input: {
  userId: string;
  isPro: boolean;
  imageUrl: string;
}): Promise<string> {
  const ocrModels = getDigimytchModelFallbackChain("openrouter/free").slice(0, 4);
  let lastError: unknown;

  for (let i = 0; i < ocrModels.length; i++) {
    try {
      const { text } = await runTrackedAIRequest(
        {
          route: i === 0 ? "api.linkedin-analyze.ocr" : "api.linkedin-analyze.ocr_fallback",
          userId: input.userId,
          isPro: input.isPro,
          config: { model: ocrModels[i], apiKeys: [] },
        },
        (model) =>
          generateText({
            model: model as LanguageModelV1,
            maxRetries: 0,
            messages: [
              {
                role: "user",
                content: [
                  { type: "image", image: input.imageUrl },
                  { type: "text", text: LINKEDIN_OCR_PROMPT },
                ],
              },
            ],
            maxTokens: 2500,
          })
      );
      const trimmed = text.trim();
      if (trimmed.length >= 20) return trimmed;
    } catch (error) {
      lastError = error;
      if (
        i < ocrModels.length - 1 &&
        (isOpenRouterModelNotFoundError(error) || isOpenRouterRateLimitError(error))
      ) {
        if (isOpenRouterRateLimitError(error)) await sleep(2000);
        continue;
      }
    }
  }

  throw lastError ?? new Error("OCR failed");
}

async function runTextAnalysis(input: {
  userId: string;
  isPro: boolean;
  profileText: string;
  isFr: boolean;
  preferredModel?: string;
}): Promise<LinkedInReport> {
  const prompt = buildAnalysisPrompt(input.profileText, input.isFr);
  const fromAi = await generateReportFromText({
    userId: input.userId,
    isPro: input.isPro,
    route: "api.linkedin-analyze.text",
    prompt,
    preferredModel: input.preferredModel,
  });
  if (fromAi) return fromAi;
  return buildHeuristicLinkedInReport(input.profileText, input.isFr);
}

export async function analyzeLinkedInScreenshot(input: {
  userId: string;
  isPro: boolean;
  imageUrl: string;
  isFr: boolean;
  preferredModel?: string;
}): Promise<LinkedInReport> {
  const vision = await runVisionAnalysis(input);
  if (vision) return vision;

  let profileText = "";
  try {
    profileText = await extractLinkedInTextFromImage({
      userId: input.userId,
      isPro: input.isPro,
      imageUrl: input.imageUrl,
    });
  } catch {
    profileText = "";
  }

  if (profileText.length < 40) {
    throw new Error("RATE_LIMIT_LINKEDIN");
  }

  return runTextAnalysis({
    userId: input.userId,
    isPro: input.isPro,
    profileText,
    isFr: input.isFr,
    preferredModel: input.preferredModel,
  });
}
