import { logger } from '@/lib/logger';
import { streamText, generateText, type LanguageModelV1 } from "ai";
import { z } from "zod";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import {
  AIUsageError,
  finishAIUsageRequest,
  startAIUsageRequest,
} from "@/lib/ai/usage-ledger";
import { getAIPlanState, resolveTaskModel, friendlyAIErrorMessage } from "@/lib/ai/plan";
import {
  getDigimytchModelFallbackChain,
  isOpenRouterModelNotFoundError,
} from "@/lib/digimytch-openrouter-models";

export const maxDuration = 120;

const MAX_MESSAGE_CONTENT = 8_000;
const MAX_MESSAGES = 40;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(MAX_MESSAGE_CONTENT),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
  system: z.string().max(4_000).optional(),
  model: z.string().max(120).optional(),
  maxTokens: z.number().int().min(1).max(2_000).optional().default(300),
  stream: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  let body: z.infer<typeof requestSchema>;
  try {
    const raw = await req.json();
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        { error: "Requête invalide", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    body = parsed.data;
  } catch {
    return Response.json({ error: "Corps de requête invalide (JSON attendu)" }, { status: 400 });
  }

  const { messages, system, maxTokens, stream } = body;

  try {
    const { isPro, userId } = await getAIPlanState();
    const preferredModel = resolveTaskModel("chat", isPro, body.model);
    const modelChain = IS_DIGIMYTCH_TALENT_HUB
      ? getDigimytchModelFallbackChain(preferredModel)
      : [preferredModel];

    let lastError: unknown;

    for (let i = 0; i < modelChain.length; i++) {
      const modelId = modelChain[i];
      const route = i === 0 ? "api.assistant" : "api.assistant.model_fallback";

      const { model, usageEventId } = await startAIUsageRequest({
        userId,
        route,
        config: { model: modelId, apiKeys: [] },
        isPro,
      });

      try {
        if (stream) {
          const result = streamText({
            model: model as LanguageModelV1,
            system: system ?? "Tu es l'assistant Digimytch Talent Hub.",
            messages,
            maxTokens,
            onFinish: async ({ usage }) => {
              await finishAIUsageRequest({ usageEventId, status: "succeeded", usage });
            },
            onError: async ({ error }) => {
              await finishAIUsageRequest({
                usageEventId,
                status: "failed",
                errorCode: error instanceof Error ? error.message : "stream_error",
              });
            },
          });
          return result.toTextStreamResponse();
        }

        const { text, usage } = await generateText({
          model: model as LanguageModelV1,
          system: system ?? "Tu es l'assistant Digimytch Talent Hub.",
          messages,
          maxTokens,
        });

        await finishAIUsageRequest({ usageEventId, status: "succeeded", usage });
        return Response.json({ text: text?.trim() ?? "" });
      } catch (error) {
        await finishAIUsageRequest({
          usageEventId,
          status: "failed",
          errorCode: error instanceof Error ? error.message : "ai_request_failed",
        });
        lastError = error;
        if (
          IS_DIGIMYTCH_TALENT_HUB &&
          isOpenRouterModelNotFoundError(error) &&
          i < modelChain.length - 1
        ) {
          logger.warn(`[api/assistant] model ${modelId} failed, trying next`);
          continue;
        }
        throw error;
      }
    }

    throw lastError ?? new Error("Assistant IA indisponible");
  } catch (error) {
    logger.error("[api/assistant]", error);
    if (error instanceof AIUsageError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    return Response.json(
      { error: friendlyAIErrorMessage(error) },
      { status: 500 }
    );
  }
}
