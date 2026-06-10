"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface SpeechRecognitionHook {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  /** Stop listening. Returns any interim transcript that was pending (not yet finalized). */
  stopListening: () => string;
  resetTranscript: () => void;
}

export function useSpeechRecognition(lang: "fr-FR" | "en-US" = "fr-FR"): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  // Track interim text in a ref so stopListening can flush it synchronously
  const interimRef = useRef("");

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const createRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + " ";
        } else {
          interimText += result[0].transcript;
        }
      }
      if (finalText) {
        setTranscript((prev) => prev + finalText);
        interimRef.current = "";
      }
      if (interimText !== undefined) {
        interimRef.current = interimText;
        setInterimTranscript(interimText);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      switch (event.error) {
        case "network":
          setError(
            "Erreur réseau. La reconnaissance vocale Chrome nécessite internet. Utilisez le champ texte."
          );
          isListeningRef.current = false;
          setIsListening(false);
          break;
        case "not-allowed":
          setError(
            "Microphone refusé. Cliquez sur 🔒 dans la barre d'adresse → Microphone → Autoriser."
          );
          isListeningRef.current = false;
          setIsListening(false);
          break;
        case "no-speech":
          if (isListeningRef.current) {
            setTimeout(() => {
              try { recognitionRef.current?.start(); } catch { /* ignore */ }
            }, 300);
          }
          return;
        case "aborted":
          return;
        default:
          setError(`Micro : erreur "${event.error}". Rechargez la page ou utilisez le champ texte.`);
          isListeningRef.current = false;
          setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        setTimeout(() => {
          try { recognitionRef.current?.start(); } catch { /* ignore */ }
        }, 200);
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }, [isSupported, lang]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Reconnaissance vocale non disponible. Utilisez Chrome ou Edge, ou tapez votre réponse.");
      return;
    }
    if (recognitionRef.current) {
      isListeningRef.current = false;
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setTranscript("");
    setInterimTranscript("");
    interimRef.current = "";
    setError(null);

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    isListeningRef.current = true;
    try {
      recognition.start();
    } catch {
      setError("Impossible de démarrer le micro. Rechargez la page.");
      isListeningRef.current = false;
    }
  }, [createRecognition, isSupported]);

  /**
   * Stop listening and return any pending interim text.
   * KEY FIX: Web Speech API may have interim (unfinalized) results when stop() is called.
   * These were previously lost silently. Now we flush them back to the caller.
   */
  const stopListening = useCallback((): string => {
    isListeningRef.current = false;
    setIsListening(false);

    const pending = interimRef.current.trim();
    interimRef.current = "";
    setInterimTranscript("");

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    // Emit the pending interim as a finalized transcript so parent effects pick it up
    if (pending) {
      setTranscript((prev) => `${prev} ${pending}`.trim());
    }

    return pending;
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    interimRef.current = "";
  }, []);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      interimRef.current = "";
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    };
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
