"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface SpeechRecognitionHook {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(lang: "fr-FR" | "en-US" = "fr-FR"): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

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
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      switch (event.error) {
        case "network":
          setError(
            "Erreur réseau. Vérifiez votre connexion internet (requis pour la reconnaissance vocale)."
          );
          isListeningRef.current = false;
          setIsListening(false);
          break;
        case "not-allowed":
          setError(
            "Accès au microphone refusé. Autorisez le micro dans Chrome > Paramètres du site."
          );
          isListeningRef.current = false;
          setIsListening(false);
          break;
        case "no-speech":
          if (isListeningRef.current) {
            setTimeout(() => {
              try {
                recognitionRef.current?.start();
              } catch {
                /* ignore */
              }
            }, 300);
          }
          return;
        case "aborted":
          return;
        default:
          setError(`Erreur : ${event.error}`);
          isListeningRef.current = false;
          setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch {
            /* ignore */
          }
        }, 200);
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }, [isSupported, lang]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Reconnaissance vocale non supportée. Utilisez Chrome ou Edge.");
      return;
    }

    if (recognitionRef.current) {
      isListeningRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }

    setTranscript("");
    setInterimTranscript("");
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

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
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
