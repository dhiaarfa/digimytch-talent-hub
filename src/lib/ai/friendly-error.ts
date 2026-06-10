import { OPENROUTER_KEY_SETUP_HINT } from "@/lib/openrouter-config";

/** Client-safe AI error messages (no server / Supabase imports). */
export function friendlyAIErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : "Impossible de contacter l'assistant IA.";
  if (/api key not found|openrouter/i.test(raw)) {
    return OPENROUTER_KEY_SETUP_HINT;
  }
  if (/no endpoints found|model not found/i.test(raw)) {
    return "Le modèle IA configuré n'est plus disponible sur OpenRouter. Rechargez la page (les modèles gratuits ont été mis à jour).";
  }
  if (/too many requests|rate limit|429|failed after \d+ attempts/i.test(raw)) {
    return "Trop de requêtes vers l'IA gratuite. Attendez 1 à 2 minutes puis réessayez.";
  }
  if (/no object generated|could not parse/i.test(raw)) {
    return "Le modèle IA n'a pas renvoyé un format valide. Essayez « openrouter/free » dans Paramètres, ou réessayez dans un instant.";
  }
  return raw;
}
