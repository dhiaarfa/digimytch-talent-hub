/**
 * Modèles OpenRouter gratuits validés (API /models).
 * Les anciens IDs (:free DeepSeek/Gemini/Llama4) renvoient 404 depuis 2025–2026.
 */

export const DIGIMYTCH_OPENROUTER_FALLBACK_CHAIN = [
  "openrouter/free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "moonshotai/kimi-k2.6:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
] as const;

/**
 * Interview-specific chain: excludes thinking/reasoning models that leak
 * chain-of-thought into the response (kimi-k2, openrouter/free routing).
 * Only non-thinking instruction-following models.
 */
export const DIGIMYTCH_INTERVIEW_MODEL_CHAIN = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
] as const;

/** Anciens IDs stockés en localStorage / docs — redirection vers des modèles actifs. */
const DEPRECATED_MODEL_ALIASES: Record<string, string> = {
  "deepseek/deepseek-chat:free": "openrouter/free",
  "deepseek/deepseek-v3.2": "openrouter/free",
  "meta-llama/llama-4-maverick:free": "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemini-2.0-flash-exp:free": "google/gemma-4-26b-a4b-it:free",
  "qwen/qwen3-235b-a22b:free": "nvidia/nemotron-3-super-120b-a12b:free",
};

export function normalizeDigimytchOpenRouterModelId(modelId?: string | null): string {
  const trimmed = modelId?.trim();
  if (!trimmed) return DIGIMYTCH_OPENROUTER_FALLBACK_CHAIN[0];
  return DEPRECATED_MODEL_ALIASES[trimmed] ?? trimmed;
}

export function isDigimytchOpenRouterModelId(modelId: string): boolean {
  const normalized = normalizeDigimytchOpenRouterModelId(modelId);
  return (DIGIMYTCH_OPENROUTER_FALLBACK_CHAIN as readonly string[]).includes(normalized);
}

export function getDigimytchModelFallbackChain(preferred?: string | null): string[] {
  const first = normalizeDigimytchOpenRouterModelId(preferred);
  const chain = [first, ...DIGIMYTCH_OPENROUTER_FALLBACK_CHAIN.filter((id) => id !== first)];
  return [...new Set(chain)];
}

/** Interview-only chain — no thinking models. */
export function getInterviewModelFallbackChain(preferred?: string | null): string[] {
  const first = normalizeDigimytchOpenRouterModelId(preferred);
  const base = [...DIGIMYTCH_INTERVIEW_MODEL_CHAIN] as string[];
  const chain = first ? [first, ...base.filter((id) => id !== first)] : base;
  return [...new Set(chain)];
}

export function isOpenRouterRateLimitError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  if (/too many requests|rate limit|429|temporarily rate/i.test(msg)) return true;
  const anyErr = error as { statusCode?: number; status?: number };
  if (anyErr.statusCode === 429 || anyErr.status === 429) return true;
  const body =
    (error as { data?: { error?: { message?: string } } })?.data?.error?.message ?? "";
  return /too many requests|rate limit|429|temporarily/i.test(body);
}

/** generateObject / JSON schema failures — try next model in chain. */
export function isStructuredOutputFailure(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /no object generated|could not parse|failed to parse|invalid json|json parse|type validation failed|did not match schema|output_parsing/i.test(
    msg
  );
}

export function isOpenRouterModelNotFoundError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  if (/no endpoints found|model not found|404/i.test(msg)) return true;
  if (isOpenRouterRateLimitError(error)) return true;
  const anyErr = error as {
    statusCode?: number;
    data?: { error?: { message?: string; code?: number } };
  };
  if (anyErr.statusCode === 404) return true;
  const body = anyErr.data?.error?.message ?? "";
  return /no endpoints found/i.test(body);
}

export function selectDigimytchModelForTask(
  task: "cv" | "matching" | "lettre" | "chat" | "interview" | "linkedin"
): string {
  switch (task) {
    case "matching":
    case "cv":
      return "openrouter/free";
    case "lettre":
      return "google/gemma-4-26b-a4b-it:free";
    case "linkedin":
      return "google/gemma-4-26b-a4b-it:free";
    case "interview":
      return "meta-llama/llama-3.3-70b-instruct:free";
    case "chat":
    default:
      return "openrouter/free";
  }
}

