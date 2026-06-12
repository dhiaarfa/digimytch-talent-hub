import { logger } from "@/lib/logger";
import type { LanguageModelUsage, LanguageModelV1 } from "ai";

import { checkRateLimit, RateLimitError, RateLimitBackendError } from "@/lib/rateLimiter";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerAnalyticsEvent } from "@/lib/analytics/server";
import { getDefaultModel, getFastCheapFreeModel } from "@/lib/ai-models";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import {
  resolveAIRequest,
  type ResolvedAIRequest,
} from "@/lib/ai/access-control";
import { createCiMockModel, isCiMockAI, isLocalDevMockAI, getDevMockText } from "@/lib/ai/ci-mock-model";
import { normalizeDigimytchOpenRouterModelId } from "@/lib/digimytch-openrouter-models";
import { createAIClientFromResolvedRequest, type AIConfig } from "@/utils/ai-tools";
import { createServiceClient } from "@/utils/supabase/server";

type AIUsageStatus = "succeeded" | "failed" | "rate_limited" | "blocked";

export class AIUsageError extends Error {
  constructor(
    message: string,
    public readonly code: "blocked" | "rate_limited" | "failed",
    public readonly status: number = 500
  ) {
    super(message);
    this.name = "AIUsageError";
  }
}

export async function recordAIUsageStarted(input: {
  userId: string;
  route: string;
  provider: string;
  model: string;
  isPro: boolean;
  usedServerKey: boolean;
}): Promise<string> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("ai_usage_events")
    .insert({
      user_id: input.userId,
      route: input.route,
      provider: input.provider,
      model: input.model,
      is_pro: input.isPro,
      used_server_key: input.usedServerKey,
      status: "started",
    })
    .select("id")
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      logger.warn("[AI ledger] insert skipped:", error.message);
      return "dev-ledger-skip";
    }
    throw error;
  }

  // Fire-and-forget — analytics must not block the AI response path
  void captureServerAnalyticsEvent({
    distinctId: input.userId,
    event: AnalyticsEvents.AIRequestStarted,
    properties: {
      route: input.route,
      provider: input.provider,
      model: input.model,
      is_pro: input.isPro,
      used_server_key: input.usedServerKey,
    },
  });

  return data.id;
}

export async function recordAIUsageFinished(input: {
  id: string;
  status: AIUsageStatus;
  errorCode?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}): Promise<void> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("ai_usage_events")
    .update({
      status: input.status,
      error_code: input.errorCode ?? null,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      total_tokens: input.totalTokens ?? null,
    })
    .eq("id", input.id)
    .select("user_id, route, provider, model, is_pro, used_server_key, status, input_tokens, output_tokens, total_tokens, error_code")
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") return;
    throw error;
  }

  // Fire-and-forget — analytics must not block the AI response path
  void captureServerAnalyticsEvent({
    distinctId: data.user_id,
    event: input.status === "succeeded"
      ? AnalyticsEvents.AIRequestSucceeded
      : AnalyticsEvents.AIRequestFailed,
    properties: {
      route: data.route,
      provider: data.provider,
      model: data.model,
      is_pro: data.is_pro,
      used_server_key: data.used_server_key,
      status: data.status,
      input_tokens: data.input_tokens,
      output_tokens: data.output_tokens,
      total_tokens: data.total_tokens,
      error_code: data.error_code,
    },
  });
}

export async function logPromptInjectionAttempt(input: {
  userId: string;
  route: string;
  details?: string;
}) {
  const usageEventId = await recordAIUsageStarted({
    userId: input.userId,
    route: `${input.route}.security`,
    provider: "security",
    model: "prompt-sanitizer",
    isPro: false,
    usedServerKey: true,
  });

  await recordAIUsageFinished({
    id: usageEventId,
    status: "failed",
    errorCode: input.details
      ? `prompt_injection_detected:${input.details}`
      : "prompt_injection_detected",
  });
}

export function usageFromLanguageModelUsage(usage?: LanguageModelUsage) {
  if (!usage) {
    return {};
  }

  return {
    inputTokens: usage.promptTokens,
    outputTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
  };
}

export async function finishAIUsageRequest(input: {
  usageEventId: string;
  status: AIUsageStatus;
  usage?: LanguageModelUsage;
  errorCode?: string;
}) {
  if (input.usageEventId === "dev-mock" || input.usageEventId === "dev-ledger-skip") return;
  await recordAIUsageFinished({
    id: input.usageEventId,
    status: input.status,
    errorCode: input.errorCode,
    ...usageFromLanguageModelUsage(input.usage),
  });
}

export async function startAIUsageRequest(input: {
  userId: string;
  route: string;
  config?: AIConfig;
  isPro: boolean;
  useThinking?: boolean;
}): Promise<{
  model: LanguageModelV1;
  usageEventId: string;
  resolved: ResolvedAIRequest;
}> {
  let requestedModel = input.config?.model ?? getDefaultModel(input.isPro);
  if (IS_DIGIMYTCH_TALENT_HUB) {
    requestedModel = normalizeDigimytchOpenRouterModelId(requestedModel);
  }

  if (isLocalDevMockAI()) {
    return {
      model: createCiMockModel(getDevMockText(input.route)),
      usageEventId: "dev-mock",
      resolved: {
        providerId: "openrouter",
        modelId: "dev-mock",
        apiKey: "",
        usedServerKey: true,
        requiresRateLimit: false,
      },
    };
  }

  let resolved: ResolvedAIRequest | undefined;

  try {
    resolved = resolveAIRequest({
      requestedModel,
      apiKeys: input.config?.apiKeys ?? [],
      isPro: input.isPro,
    });
  } catch (firstError) {
    const freeFallback = getFastCheapFreeModel();
    if (IS_DIGIMYTCH_TALENT_HUB && requestedModel !== freeFallback) {
      try {
        requestedModel = freeFallback;
        resolved = resolveAIRequest({
          requestedModel: freeFallback,
          apiKeys: input.config?.apiKeys ?? [],
          isPro: input.isPro,
        });
      } catch {
        resolved = undefined;
      }
    }

    if (!resolved) {
      const error = firstError;
      const usageEventId = await recordAIUsageStarted({
        userId: input.userId,
        route: input.route,
        provider: "unknown",
        model: requestedModel,
        isPro: input.isPro,
        usedServerKey: false,
      });

      await recordAIUsageFinished({
        id: usageEventId,
        status: "blocked",
        errorCode: error instanceof Error ? error.message : "access_denied",
      });

      throw new AIUsageError(
        error instanceof Error ? error.message : "AI request blocked",
        "blocked",
        403
      );
    }
  }

  const usageEventId = await recordAIUsageStarted({
    userId: input.userId,
    route: input.route,
    provider: resolved.providerId,
    model: resolved.modelId,
    isPro: input.isPro,
    usedServerKey: resolved.usedServerKey,
  });

  try {
    await checkRateLimit(input.userId, input.route);
  } catch (error) {
    if (error instanceof RateLimitBackendError) {
      await recordAIUsageFinished({
        id: usageEventId,
        status: "failed",
        errorCode: "rate_limit_backend_unavailable",
      });
      throw new AIUsageError(
        "Service temporairement indisponible. Réessayez dans un instant.",
        "failed",
        503
      );
    }
    const retryAfter =
      error instanceof RateLimitError ? error.retryAfterSeconds : 60;
    await recordAIUsageFinished({
      id: usageEventId,
      status: "rate_limited",
      errorCode: `rate_limit_exceeded:${retryAfter}s`,
    });

    throw new AIUsageError(
      `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      "rate_limited",
      429
    );
  }

  return {
    model: isCiMockAI()
      ? createCiMockModel()
      : createAIClientFromResolvedRequest(resolved, input.useThinking),
    usageEventId,
    resolved,
  };
}
