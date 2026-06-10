"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  getRecognitionEndAction,
  RECOGNITION_RESTART_DELAY_MS,
  shouldRetryRecognitionAfterError,
  SILENCE_SUBMIT_MS,
} from "@/components/interview/interview-recognition-lifecycle";

export type InterviewRecognitionCallbacks = {
  onTranscript: (text: string) => void;
  onSilenceSubmit: (text: string) => void;
  onError: (message: string) => void;
};

/**
 * Web Speech recognition for one interview listening turn.
 * Chrome uses single-shot sessions (`continuous: false`); we restart automatically
 * while the caller keeps the session open via start()/stop().
 */
export function useInterviewRecognition(
  lang: "fr-FR" | "en-US",
  callbacks: InterviewRecognitionCallbacks
) {
  const callbacksRef = useRef(callbacks);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRunningRef = useRef(false);
  const sessionActiveRef = useRef(false);
  const liveRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const scheduleSilenceSubmit = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      const text = liveRef.current.trim();
      if (text.length >= 2 && sessionActiveRef.current) {
        callbacksRef.current.onSilenceSubmit(text);
      }
    }, SILENCE_SUBMIT_MS);
  }, [clearSilenceTimer]);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const abortRecognitionInstance = useCallback(() => {
    clearSilenceTimer();
    clearRestartTimer();
    isRunningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
  }, [clearRestartTimer, clearSilenceTimer]);

  const spawnRecognitionRef = useRef<(preserveTranscript: boolean) => void>(() => {});

  const scheduleRecognitionRestart = useCallback(() => {
    clearRestartTimer();
    restartTimerRef.current = setTimeout(() => {
      if (sessionActiveRef.current && !isRunningRef.current) {
        spawnRecognitionRef.current(true);
      }
    }, RECOGNITION_RESTART_DELAY_MS);
  }, [clearRestartTimer]);

  const handleRecognitionEnd = useCallback(() => {
    isRunningRef.current = false;
    recognitionRef.current = null;

    const action = getRecognitionEndAction(
      sessionActiveRef.current,
      liveRef.current
    );

    switch (action.type) {
      case "idle":
        clearSilenceTimer();
        break;
      case "restart":
        scheduleRecognitionRestart();
        break;
      case "schedule_silence_submit_and_restart":
        scheduleSilenceSubmit();
        scheduleRecognitionRestart();
        break;
    }
  }, [clearSilenceTimer, scheduleRecognitionRestart, scheduleSilenceSubmit]);

  spawnRecognitionRef.current = (preserveTranscript: boolean) => {
    if (typeof window === "undefined") return;
    if (!sessionActiveRef.current) return;
    if (isRunningRef.current) return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    if (!preserveTranscript) {
      liveRef.current = "";
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isRunningRef.current = true;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let segment = "";
      for (let i = 0; i < event.results.length; i++) {
        segment += event.results[i][0].transcript;
      }
      segment = segment.trim();
      const prefix = preserveTranscript ? liveRef.current.trim() : "";
      liveRef.current = prefix && segment ? `${prefix} ${segment}` : prefix || segment;
      callbacksRef.current.onTranscript(liveRef.current);
      if (liveRef.current.length >= 2) {
        scheduleSilenceSubmit();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      isRunningRef.current = false;
      recognitionRef.current = null;
      clearSilenceTimer();

      if (event.error === "aborted") {
        return;
      }

      if (shouldRetryRecognitionAfterError(event.error, sessionActiveRef.current)) {
        scheduleRecognitionRestart();
        return;
      }

      sessionActiveRef.current = false;

      const messages: Record<string, string> = {
        "not-allowed":
          "Micro refusé. Autorisez le micro (icône cadenas) ou répondez par texte.",
        network:
          "Erreur réseau (STT Chrome nécessite internet). Répondez par texte.",
        "audio-capture": "Micro introuvable. Branchez un micro ou utilisez le texte.",
      };
      callbacksRef.current.onError(
        messages[event.error] ??
          `Erreur micro (${event.error}). Réessayez ou utilisez le texte.`
      );
    };

    recognition.onend = handleRecognitionEnd;

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      isRunningRef.current = false;
      recognitionRef.current = null;
      if (sessionActiveRef.current) {
        scheduleRecognitionRestart();
      } else {
        callbacksRef.current.onError(
          "Impossible de démarrer le micro. Réessayez ou utilisez le texte."
        );
      }
    }
  };

  const stop = useCallback(() => {
    sessionActiveRef.current = false;
    abortRecognitionInstance();
    const pending = liveRef.current.trim();
    liveRef.current = "";
    return pending;
  }, [abortRecognitionInstance]);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    if (sessionActiveRef.current && isRunningRef.current) return;

    if (!isSupported) {
      callbacksRef.current.onError(
        "Reconnaissance vocale indisponible. Utilisez Chrome ou Edge, ou répondez par texte."
      );
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      callbacksRef.current.onError("Web Speech API non supportée.");
      return;
    }

    sessionActiveRef.current = true;
    abortRecognitionInstance();
    sessionActiveRef.current = true;
    spawnRecognitionRef.current(false);
  }, [abortRecognitionInstance, isSupported]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return useMemo(
    () => ({
      start,
      stop,
      isSupported,
      isRunning: () => isRunningRef.current,
    }),
    [isSupported, start, stop]
  );
}
