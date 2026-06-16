import type { LanguageModelUsage, LanguageModelV1 } from "ai";
import type { AIConfig } from "@/utils/ai-tools";
import {
  finishAIUsageRequest,
  startAIUsageRequest,
} from "@/lib/ai/usage-ledger";
import {
  getDigimytchModelFallbackChain,
  isOpenRouterModelNotFoundError,
  isStructuredOutputFailure,
} from "@/lib/digimytch-openrouter-models";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { logger } from "@/lib/logger";

export async function runTrackedAIRequest<T extends { usage?: LanguageModelUsage }>(
  input: {
    route: string;
    userId: string;
    isPro: boolean;
    config?: AIConfig;
    useThinking?: boolean;
    /** When set, use this chain instead of the default Digimytch chain (e.g. interview). */
    fallbackChain?: readonly string[];
  },
  task: (model: LanguageModelV1) => Promise<T>
): Promise<T> {
  const chain =
    input.fallbackChain && input.fallbackChain.length > 0
      ? [...input.fallbackChain]
      : IS_DIGIMYTCH_TALENT_HUB
        ? getDigimytchModelFallbackChain(input.config?.model)
        : ([input.config?.model].filter(Boolean) as string[]);

  const modelsToTry =
    chain.length > 0 ? chain : [input.config?.model ?? "openrouter/free"];

  let lastError: unknown;

  for (let i = 0; i < modelsToTry.length; i++) {
    const modelId = modelsToTry[i];
    const route =
      i === 0 ? input.route : `${input.route}.model_fallback`;

    const { model, usageEventId } = await startAIUsageRequest({
      ...input,
      route,
      config: {
        model: modelId,
        apiKeys: input.config?.apiKeys ?? [],
        ...(input.config?.customPrompts
          ? { customPrompts: input.config.customPrompts }
          : {}),
      },
    });

    try {
      const result = await task(model);
      await finishAIUsageRequest({
        usageEventId,
        status: "succeeded",
        usage: result.usage,
      });
      if (i > 0) {
        logger.warn(`[AI] ${input.route} succeeded with fallback model ${modelId}`);
      }
      return result;
    } catch (error) {
      await finishAIUsageRequest({
        usageEventId,
        status: "failed",
        errorCode: error instanceof Error ? error.message : "ai_request_failed",
      });

      lastError = error;

      const canTryNextModel = i < modelsToTry.length - 1;
      if (
        IS_DIGIMYTCH_TALENT_HUB &&
        canTryNextModel &&
        (isOpenRouterModelNotFoundError(error) || isStructuredOutputFailure(error))
      ) {
        logger.warn(
          `[AI] ${input.route} model ${modelId} failed (${error instanceof Error ? error.message : "error"}), trying next…`
        );
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error("AI request failed");
}
