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
    .replace(/[,;:]/g, " ")
    .replace(/[?!]/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

function getBestFrenchVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis.getVoices();

  const preferences = [
    (v: SpeechSynthesisVoice) =>
      v.name.includes("Denise") && v.lang.startsWith("fr"),
    (v: SpeechSynthesisVoice) =>
      v.name.includes("Henri") && v.lang.startsWith("fr"),
    (v: SpeechSynthesisVoice) =>
      v.name.includes("Sylvie") && v.lang.startsWith("fr"),
    (v: SpeechSynthesisVoice) =>
      v.name.includes("Hortense") && v.lang.startsWith("fr"),
    (v: SpeechSynthesisVoice) =>
      v.name.includes("Google") && v.lang.startsWith("fr"),
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
};

export function speakText(text: string, options: SpeakTextOptions = {}): void {
  if (typeof window === "undefined") return;

  const clean = sanitizeTextForSpeech(text);
  if (!clean) {
    options.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const truncated =
    clean.length > 300 ? `${clean.substring(0, 297)}...` : clean;

  const utterance = new SpeechSynthesisUtterance(truncated);

  const setVoiceAndSpeak = () => {
    const voice = getBestFrenchVoice();
    if (voice) utterance.voice = voice;

    utterance.lang = "fr-FR";
    utterance.rate = options.rate ?? 1.15;
    utterance.pitch = options.pitch ?? 1.05;
    utterance.volume = 1;

    utterance.onstart = () => options.onStart?.();
    utterance.onend = () => options.onEnd?.();
    utterance.onerror = () => options.onEnd?.();
    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === "word") {
        options.onWordBoundary?.(event.charIndex);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    let spoken = false;
    const handler = () => {
      if (spoken) return;
      spoken = true;
      window.speechSynthesis.onvoiceschanged = null;
      setVoiceAndSpeak();
    };
    window.speechSynthesis.onvoiceschanged = handler;
    setTimeout(handler, 350);
  } else {
    setVoiceAndSpeak();
  }
}

/** @deprecated Utiliser speakText */
export function pickFrenchRecruiterVoice(): SpeechSynthesisVoice | null {
  return getBestFrenchVoice();
}

export function speakFrenchRecruiter(
  text: string,
  options?: {
    onEnd?: () => void;
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onWordBoundary?: (charIndex: number) => void;
  }
): void {
  speakText(text, {
    onEnd: options?.onEnd,
    onStart: options?.onStart,
    onWordBoundary: options?.onWordBoundary,
    rate: options?.rate,
    pitch: options?.pitch,
  });
}

export async function requestMicrophoneAccess(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { ok: true };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true };
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return {
        ok: false,
        error:
          "Micro refusé. Autorisez le micro pour ce site dans les paramètres du navigateur.",
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
