/** Nettoie le texte avant synthèse vocale (pas de markdown ni ponctuation lue). */
export function sanitizeTextForSpeech(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[\s]*[-•*–—]\s+/gm, "")
    .replace(/[*#_`~|\\]/g, "")
    .replace(/[—–]/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/[;:]/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pre-warm the voice list so it's available instantly when speakText is first called.
 * Call this once on component mount — fixes the "silent first sentence" Chrome bug.
 */
export function prewarmVoices(): void {
  if (typeof window === "undefined") return;
  // Trigger the browser to load voices — harmless no-op if already loaded
  window.speechSynthesis.getVoices();
}

function getBestFrenchVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis.getVoices();

  const preferences = [
    // Neural / premium voices (best quality, most natural)
    (v: SpeechSynthesisVoice) => v.lang.startsWith("fr") && (v.name.includes("Neural") || v.name.includes("neural")),
    // Google voices (second best)
    (v: SpeechSynthesisVoice) => v.lang === "fr-FR" && v.name.includes("Google"),
    (v: SpeechSynthesisVoice) => v.lang.startsWith("fr") && v.name.includes("Google"),
    // Windows named voices (Denise is the best Windows French voice)
    (v: SpeechSynthesisVoice) => v.name.includes("Denise") && v.lang.startsWith("fr"),
    (v: SpeechSynthesisVoice) => v.name.includes("Hortense") && v.lang.startsWith("fr"),
    (v: SpeechSynthesisVoice) => v.name.includes("Audrey") && v.lang.startsWith("fr"),
    (v: SpeechSynthesisVoice) => v.name.includes("Amelie") && v.lang.startsWith("fr"),
    (v: SpeechSynthesisVoice) => v.name.includes("Sylvie") && v.lang.startsWith("fr"),
    // Any non-male French voice
    (v: SpeechSynthesisVoice) => v.lang === "fr-FR" && !v.name.includes("Henri") && !v.name.includes("Thomas") && !v.name.includes("Rémi") && !v.name.includes("Remi"),
    (v: SpeechSynthesisVoice) => v.lang.startsWith("fr"),
    (v: SpeechSynthesisVoice) => v.lang.startsWith("en"),
  ];

  for (const pref of preferences) {
    const voice = voices.find(pref);
    if (voice) return voice;
  }
  return null;
}

export type SpeakTextOptions = {
  onStart?: () => void;
  onEnd?: () => void;
  onWordBoundary?: (charIndex: number) => void;
  rate?: number;
  pitch?: number;
  lang?: string;
};

/**
 * Chrome has a known bug: speechSynthesis pauses/freezes after ~15 seconds
 * in background tabs. Fix: call resume() every 10 seconds while speaking.
 */
function startChromeTTSKeepAlive(): ReturnType<typeof setInterval> {
  return setInterval(() => {
    if (typeof window !== "undefined" && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 14_000);
}

export function speakText(text: string, options: SpeakTextOptions = {}): void {
  if (typeof window === "undefined") return;

  const clean = sanitizeTextForSpeech(text);
  if (!clean) {
    options.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  // Cap at 900 chars so full recruiter questions are always spoken
  const truncated = clean.length > 900 ? `${clean.substring(0, 897)}…` : clean;

  const utterance = new SpeechSynthesisUtterance(truncated);

  const setVoiceAndSpeak = (lang: string) => {
    const voices = window.speechSynthesis.getVoices();
    const isEn = lang.startsWith("en");

    const voice =
      voices.find((v) => v.lang === lang && (v.name.includes("Neural") || v.name.includes("neural"))) ??
      voices.find((v) => v.lang.startsWith(lang.substring(0, 2)) && (v.name.includes("Neural") || v.name.includes("neural"))) ??
      voices.find((v) => v.lang === lang && v.name.includes("Google")) ??
      voices.find((v) => v.lang.startsWith(lang.substring(0, 2)) && v.name.includes("Google")) ??
      voices.find((v) => v.lang === lang) ??
      voices.find((v) => v.lang.startsWith(lang.substring(0, 2))) ??
      (isEn ? voices.find((v) => v.lang.startsWith("en")) : getBestFrenchVoice()) ??
      null;

    if (voice) utterance.voice = voice;
    utterance.lang = lang;
    // 1.1 = natural cadence, clearly intelligible, not rushed
    utterance.rate = options.rate ?? 1.1;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = 1;

    // Chrome TTS anti-freeze keep-alive
    let keepAlive: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (keepAlive !== null) {
        clearInterval(keepAlive);
        keepAlive = null;
      }
    };

    utterance.onstart = () => {
      keepAlive = startChromeTTSKeepAlive();
      options.onStart?.();
    };
    utterance.onend = () => {
      cleanup();
      options.onEnd?.();
    };
    utterance.onerror = (e) => {
      cleanup();
      // "interrupted" = we called cancel() ourselves — not a real error
      if (e.error !== "interrupted") options.onEnd?.();
    };
    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === "word") options.onWordBoundary?.(event.charIndex);
    };

    window.speechSynthesis.speak(utterance);
  };

  const targetLang = options.lang ?? "fr-FR";

  if (window.speechSynthesis.getVoices().length === 0) {
    let spoken = false;
    const handler = () => {
      if (spoken) return;
      spoken = true;
      window.speechSynthesis.onvoiceschanged = null;
      setVoiceAndSpeak(targetLang);
    };
    window.speechSynthesis.onvoiceschanged = handler;
    // 150ms fallback (was 800ms — no reason to wait that long)
    setTimeout(handler, 150);
  } else {
    setVoiceAndSpeak(targetLang);
  }
}

export async function requestMicrophoneAccess(): Promise<{ ok: boolean; error?: string }> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { ok: true };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true };
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return {
        ok: false,
        error: "Micro refusé. Autorisez le micro pour ce site dans les paramètres du navigateur.",
      };
    }
    if (name === "NotFoundError") {
      return { ok: false, error: "Aucun microphone détecté sur cet appareil." };
    }
    return { ok: false, error: "Impossible d'accéder au microphone." };
  }
}

export function cancelSpeech(): void {
  if (typeof window !== "undefined") {
    window.speechSynthesis.cancel();
  }
}
