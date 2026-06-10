import { makeSilentTestWav } from "@/lib/stt-test-audio";
import { getOpenRouterApiKey, OPENROUTER_KEY_SETUP_HINT } from "@/lib/openrouter-config";

/**
 * Vérifie si OpenRouter peut traiter l'audio (Whisper) avec le solde actuel.
 * OpenRouter exige typiquement ≥ 0,50 $ de crédits pour l'audio.
 */

export type OpenRouterCapabilities = {
  keyValid: boolean;
  audioSttAvailable: boolean;
  /** Solde / usage indicatif si l'API le renvoie */
  usageUsd?: number;
  /** Message pour l'UI */
  hint: string;
};

const MIN_AUDIO_BALANCE_USD = 0.5;

export async function getOpenRouterCapabilities(): Promise<OpenRouterCapabilities> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    return {
      keyValid: false,
      audioSttAvailable: false,
      hint: OPENROUTER_KEY_SETUP_HINT,
    };
  }

  let usageUsd: number | undefined;

  try {
    const keyRes = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!keyRes.ok) {
      return {
        keyValid: false,
        audioSttAvailable: false,
        hint: "Clé OpenRouter invalide ou expirée.",
      };
    }
    const keyData = (await keyRes.json()) as {
      data?: { usage?: number };
      usage?: number;
    };
    usageUsd = keyData.data?.usage ?? keyData.usage;
  } catch {
    return {
      keyValid: true,
      audioSttAvailable: false,
      hint: "OpenRouter injoignable — micro navigateur (Chrome/Edge) utilisé.",
    };
  }

  try {
    const wav = makeSilentTestWav(1);
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3001";

    const sttRes = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": "Digimytch Talent Hub",
      },
      body: JSON.stringify({
        model: "openai/whisper-large-v3",
        language: "fr",
        input_audio: { data: wav.toString("base64"), format: "wav" },
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (sttRes.ok) {
      return {
        keyValid: true,
        audioSttAvailable: true,
        usageUsd,
        hint: "Transcription OpenRouter disponible.",
      };
    }

    const errBody = (await sttRes.json()) as { error?: { message?: string } };
    const msg = errBody.error?.message || "";
    const needsCredits =
      msg.includes("$0.50") ||
      msg.includes("balance") ||
      msg.includes("credits");

    if (needsCredits) {
      return {
        keyValid: true,
        audioSttAvailable: false,
        usageUsd,
        hint: `Crédits audio OpenRouter insuffisants (≥ ${MIN_AUDIO_BALANCE_USD} $ requis). Micro Chrome utilisé automatiquement.`,
      };
    }

    return {
      keyValid: true,
      audioSttAvailable: false,
      usageUsd,
      hint: msg || "Audio OpenRouter indisponible — micro navigateur.",
    };
  } catch {
    return {
      keyValid: true,
      audioSttAvailable: false,
      usageUsd,
      hint: "Test audio OpenRouter échoué — micro navigateur.",
    };
  }
}
