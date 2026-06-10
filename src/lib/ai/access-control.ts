import {
  getModelById,
  getProviderById,
  DIGIMYTCH_FREE_MODELS,
  type AIModel,
} from "@/lib/ai-models";
import type { ServiceName } from "@/lib/types";
import { getOpenRouterApiKey } from "@/lib/openrouter-config";

interface APIKeyInput {
  service: string;
  key: string;
  addedAt?: string;
}

export interface ResolveAIRequestInput {
  requestedModel: string;
  apiKeys: APIKeyInput[];
  isPro: boolean;
}

export interface ResolvedAIRequest {
  providerId: ServiceName;
  modelId: string;
  apiKey: string;
  usedServerKey: boolean;
  requiresRateLimit: boolean;
}

type HiddenModel = Pick<AIModel, "id" | "name" | "provider" | "features" | "availability">;

const HIDDEN_MODELS: Record<string, HiddenModel> = {
  "openai/gpt-5-nano": {
    id: "openai/gpt-5-nano",
    name: "GPT-5 Nano",
    provider: "openrouter",
    features: {
      isFree: true,
      isUnstable: false,
      maxTokens: 400000,
      supportsVision: false,
      supportsTools: true,
    },
    availability: {
      requiresApiKey: false,
      requiresPro: false,
    },
  },
};

function getKnownModel(modelId: string): HiddenModel | undefined {
  const fromCatalog = getModelById(modelId);
  if (fromCatalog) return fromCatalog;

  const digimytchFree = DIGIMYTCH_FREE_MODELS.find((m) => m.id === modelId);
  if (digimytchFree) {
    return {
      id: digimytchFree.id,
      name: digimytchFree.name,
      provider: "openrouter",
      features: {
        isFree: true,
        isUnstable: false,
        maxTokens: 128000,
        supportsVision: false,
        supportsTools: true,
      },
      availability: {
        requiresApiKey: false,
        requiresPro: false,
      },
    };
  }

  return HIDDEN_MODELS[modelId];
}

function findUserKey(apiKeys: ResolveAIRequestInput["apiKeys"], providerId: ServiceName) {
  return apiKeys.find((apiKey) => apiKey.service === providerId)?.key;
}

function getServerKey(providerId: ServiceName) {
  const provider = getProviderById(providerId);
  if (!provider) {
    throw new Error(`Unsupported provider: ${providerId}`);
  }

  const apiKey =
    providerId === "openrouter"
      ? getOpenRouterApiKey() ?? undefined
      : process.env[provider.envKey]?.trim() || undefined;

  return {
    provider,
    apiKey,
  };
}

export function resolveAIRequest(input: ResolveAIRequestInput): ResolvedAIRequest {
  const model = getKnownModel(input.requestedModel);

  if (!model) {
    throw new Error(`Unknown model: ${input.requestedModel}`);
  }

  const provider = getProviderById(model.provider);
  if (!provider) {
    throw new Error(`Unsupported provider: ${model.provider}`);
  }

  const freeServerModel =
    model.features.isFree === true && model.availability.requiresPro === false;

  if (input.isPro || freeServerModel) {
    const { apiKey } = getServerKey(model.provider);

    if (apiKey) {
      return {
        providerId: model.provider,
        modelId: model.id,
        apiKey,
        usedServerKey: true,
        requiresRateLimit: true,
      };
    }
  }

  const userApiKey = findUserKey(input.apiKeys, model.provider);
  if (!userApiKey) {
    throw new Error(`${provider.name} API key not found in user configuration`);
  }

  return {
    providerId: model.provider,
    modelId: model.id,
    apiKey: userApiKey,
    usedServerKey: false,
    requiresRateLimit: false,
  };
}
