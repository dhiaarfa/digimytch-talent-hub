"use client";

import { useCallback, useRef, useState } from "react";

type TranscribeResult = {
  text?: string;
  error?: string;
  fallbackToBrowser?: boolean;
};

export function useMediaStt(
  lang: "fr" | "en",
  onFallbackToBrowser?: () => void
) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const onTextRef = useRef<(text: string) => void>(() => {});

  const transcribeBlob = useCallback(
    async (blob: Blob): Promise<string> => {
      const fd = new FormData();
      fd.set("audio", blob, "speech.webm");
      fd.set("lang", lang);
      const res = await fetch("/api/speech/transcribe", { method: "POST", body: fd });
      const json = (await res.json()) as TranscribeResult;
      if (!res.ok) {
        const msg = json.error || "Transcription impossible";
        if (json.fallbackToBrowser) {
          onFallbackToBrowser?.();
          throw new Error(
            "Crédits audio OpenRouter insuffisants — bascule automatique sur le micro Chrome."
          );
        }
        if (res.status === 503 && msg.includes("OPENROUTER")) {
          throw new Error(
            "Ajoutez OPENROUTER_API_KEY dans .env (https://openrouter.ai/keys) pour la transcription vocale."
          );
        }
        throw new Error(msg);
      }
      return json.text || "";
    },
    [lang, onFallbackToBrowser]
  );

  const recordOnce = useCallback(
    (stream: MediaStream, ms: number) =>
      new Promise<Blob>((resolve, reject) => {
        const chunks: Blob[] = [];
        const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        const recorder = new MediaRecorder(stream, { mimeType: mime });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onerror = () => reject(new Error("Enregistrement audio échoué"));
        recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
        recorder.start();
        setTimeout(() => {
          if (recorder.state !== "inactive") recorder.stop();
        }, ms);
      }),
    []
  );

  const loopRef = useRef<Promise<void> | null>(null);

  const runLoop = useCallback(
    async (stream: MediaStream) => {
      while (activeRef.current) {
        try {
          const blob = await recordOnce(stream, 2800);
          if (!activeRef.current || blob.size < 800) continue;
          const text = await transcribeBlob(blob);
          if (text.trim()) onTextRef.current(text.trim());
        } catch (e) {
          if (activeRef.current) {
            setError(e instanceof Error ? e.message : "Erreur transcription");
          }
          break;
        }
      }
    },
    [recordOnce, transcribeBlob]
  );

  const startRecording = useCallback(
    async (onText: (text: string) => void) => {
      onTextRef.current = onText;
      setError(null);
      if (activeRef.current) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        activeRef.current = true;
        setIsRecording(true);
        loopRef.current = runLoop(stream);
      } catch {
        setError("Micro inaccessible. Autorisez le micro pour ce site.");
      }
    },
    [runLoop]
  );

  const stopRecording = useCallback(async () => {
    activeRef.current = false;
    setIsRecording(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    await loopRef.current?.catch(() => {});
    loopRef.current = null;
  }, []);

  return { isRecording, error, startRecording, stopRecording };
}
