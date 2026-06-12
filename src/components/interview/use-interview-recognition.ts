"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  RECOGNITION_RESTART_DELAY_MS,
  SILENCE_SUBMIT_MS,
} from "@/components/interview/interview-recognition-lifecycle";

export type InterviewRecognitionCallbacks = {
  onTranscript: (text: string) => void;
  onSilenceSubmit: (text: string) => void;
  onError: (message: string) => void;
};

/**
 * Web Speech recognition for one interview listening turn.
 *
 * Key design: `continuous: true` keeps Chrome's session alive for the entire
 * listening phase -- no stop/restart cycle, no race conditions between turns.
 *
 * Silence detection uses a 300ms polling interval rather than a setTimeout
 * restart chain, which was the root cause of the mic dropping after turn 1.
 */
export function useInterviewRecognition(
  lang: "fr-FR" | "en-US",
  callbacks: InterviewRecognitionCallbacks
) {
  const callbacksRef = useRef(callbacks);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const sessionActiveRef = useRef(false);  // true = engine wants mic open
  const isRunningRef = useRef(false);      // true = Chrome session alive
  // Text from prior sessions in the same turn (preserved across no-speech restarts)
  const priorTextRef = useRef("");
  // Current live transcript (prior + current session)
  const liveRef = useRef("");
  const lastResultTimeRef = useRef(0);
  const silenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittedRef = useRef(false); // prevent double-fire of onSilenceSubmit

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // -- Silence interval -------------------------------------------------------

  const stopSilenceInterval = useCallback(() => {
    if (silenceIntervalRef.current !== null) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
  }, []);

  const startSilenceInterval = useCallback(() => {
    stopSilenceInterval();
    silenceIntervalRef.current = setInterval(() => {
      if (!sessionActiveRef.current || submittedRef.current) return;
      const text = liveRef.current.trim();
      if (text.length < 2) return;
      if (Date.now() - lastResultTimeRef.current >= SILENCE_SUBMIT_MS) {
        submittedRef.current = true;
        stopSilenceInterval();
        callbacksRef.current.onSilenceSubmit(text);
      }
    }, 300);
  }, [stopSilenceInterval]);

  // -- Restart timer ----------------------------------------------------------

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current !== null) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  // -- Spawn Chrome SpeechRecognition session ---------------------------------

  const spawnSessionRef = useRef<() => void>(() => {});

  spawnSessionRef.current = () => {
    if (typeof window === "undefined") return;
    if (!sessionActiveRef.current) return;
    if (isRunningRef.current) return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;      // Keep session alive -- no stop/restart race
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isRunningRef.current = true;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Rebuild transcript from all results in the current session
      let sessionFinal = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        const t = r[0].transcript.trim();
        if (r.isFinal) {
          sessionFinal = sessionFinal ? `${sessionFinal} ${t}` : t;
        } else {
          interim = t;
        }
      }

      // Combine with text from previous sessions in this turn (if restart happened)
      const prior = priorTextRef.current;
      const allFinal = prior
        ? sessionFinal ? `${prior} ${sessionFinal}` : prior
        : sessionFinal;

      liveRef.current = interim
        ? allFinal ? `${allFinal} ${interim}` : interim
        : allFinal;

      if (liveRef.current.length >= 2) {
        lastResultTimeRef.current = Date.now();
        callbacksRef.current.onTranscript(liveRef.current);
        if (!submittedRef.current) {
          startSilenceInterval(); // arm/reset silence detection
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "aborted" = we called abort() ourselves, ignore
      if (event.error === "aborted") return;
      // "no-speech" = Chrome timed out; onend fires right after and restarts
      if (event.error === "no-speech") return;

      // Fatal error: surface to user
      isRunningRef.current = false;
      recognitionRef.current = null;
      sessionActiveRef.current = false;
      stopSilenceInterval();

      const messages: Record<string, string> = {
        "not-allowed": "Micro refuse. Autorisez le micro ou repondez par texte.",
        network: "Erreur reseau (Chrome STT necessite internet). Repondez par texte.",
        "audio-capture": "Micro introuvable. Branchez un micro ou utilisez le texte.",
      };
      callbacksRef.current.onError(
        messages[event.error] ??
          `Erreur micro (${event.error}). Reessayez ou utilisez le texte.`
      );
    };

    recognition.onend = () => {
      isRunningRef.current = false;
      recognitionRef.current = null;

      // Expected end (we called abort()) -- nothing to do
      if (!sessionActiveRef.current) return;

      // Unexpected end (no-speech timeout, Chrome bug):
      // preserve accumulated text and restart the session.
      priorTextRef.current = liveRef.current.trim();

      // CRITICAL: reset the silence clock so the interval doesn't fire
      // immediately after restart (which was cutting the user off mid-sentence).
      lastResultTimeRef.current = Date.now();

      clearRestartTimer();
      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null;
        spawnSessionRef.current();
      }, RECOGNITION_RESTART_DELAY_MS);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      isRunningRef.current = false;
      recognitionRef.current = null;
      if (sessionActiveRef.current) {
        clearRestartTimer();
        restartTimerRef.current = setTimeout(() => {
          restartTimerRef.current = null;
          spawnSessionRef.current();
        }, RECOGNITION_RESTART_DELAY_MS);
      } else {
        callbacksRef.current.onError(
          "Impossible de demarrer le micro. Reessayez ou utilisez le texte."
        );
      }
    }
  };

  // -- Public API -------------------------------------------------------------

  /** Called by the engine at the start of each listening turn. */
  const start = useCallback(() => {
    if (typeof window === "undefined") return;

    if (!isSupported) {
      callbacksRef.current.onError(
        "Reconnaissance vocale indisponible. Utilisez Chrome ou Edge, ou repondez par texte."
      );
      return;
    }

    // Tear down any lingering session
    sessionActiveRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    isRunningRef.current = false;

    // Reset per-turn state
    priorTextRef.current = "";
    liveRef.current = "";
    lastResultTimeRef.current = 0;
    submittedRef.current = false;
    stopSilenceInterval();
    clearRestartTimer();

    // Start the session
    sessionActiveRef.current = true;
    spawnSessionRef.current();
  }, [clearRestartTimer, isSupported, stopSilenceInterval]);

  /**
   * Called by the engine when it stops listening.
   * Returns whatever was transcribed (in case onSilenceSubmit was not yet fired).
   */
  const stop = useCallback(() => {
    sessionActiveRef.current = false;
    stopSilenceInterval();
    clearRestartTimer();

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    isRunningRef.current = false;

    const pending = liveRef.current.trim();
    priorTextRef.current = "";
    liveRef.current = "";
    return pending;
  }, [clearRestartTimer, stopSilenceInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stop(); };
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
