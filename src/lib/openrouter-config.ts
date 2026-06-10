const PLACEHOLDER_FRAGMENTS = [
  "your_openrouter_key",
  "your-openrouter-key",
  "replace_me",
  "changeme",
  "xxx",
  "example",
] as const;

/** Returns a usable OpenRouter key, or null if missing / placeholder. */
export function getOpenRouterApiKey(): string | null {
  const raw = process.env.OPENROUTER_API_KEY?.trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  if (PLACEHOLDER_FRAGMENTS.some((fragment) => lower.includes(fragment))) {
    return null;
  }

  // Real OpenRouter keys are longer than placeholder strings
  if (raw.length < 32) return null;

  return raw;
}

export function hasOpenRouterServerKey(): boolean {
  return getOpenRouterApiKey() !== null;
}

export const OPENROUTER_KEY_SETUP_HINT =
  "Ajoutez une vraie clé OpenRouter dans .env (OPENROUTER_API_KEY=sk-or-v1-…). Obtenez-la sur https://openrouter.ai/keys";
