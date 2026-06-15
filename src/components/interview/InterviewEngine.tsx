"use client";

import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Loader2, Mic, RotateCcw, Send, Star, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { AIConfig } from "@/lib/ai-models";
import {
  INTERVIEW_MAX_TURNS,
  type InterviewMessage,
  type InterviewScenario,
} from "@/lib/interview-simulator";
import {
  continueInterviewSimulation,
  finishInterviewSimulation,
  startInterviewSimulation,
} from "@/utils/actions/digimytch/interview-simulator";
import { cancelSpeech, prewarmVoices, requestMicrophoneAccess, speakText } from "@/lib/speech-tts";
import {
  initialInterviewEngineState,
  interviewEngineReducer,
} from "@/components/interview/interview-engine-reducer";
import { LISTENING_START_DELAY_MS } from "@/components/interview/interview-recognition-lifecycle";
import { useInterviewRecognition } from "@/components/interview/use-interview-recognition";

const PHASE_LABELS: Record<string, { fr: string; en: string }> = {
  booting: { fr: "Préparation…", en: "Starting…" },
  listening: { fr: "À vous — parlez ou écrivez", en: "Your turn — speak or type" },
  processing: { fr: "Réflexion…", en: "Thinking…" },
  speaking: { fr: "Le recruteur parle", en: "Recruiter speaking" },
  complete: { fr: "Terminé", en: "Complete" },
  error: { fr: "Erreur", en: "Error" },
};

function MicPulse({ listening }: { listening: boolean }) {
  if (!listening) return null;
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {[1, 2, 3, 4, 3, 2, 1].map((h, idx) => (
        <div
          key={idx}
          className="w-1 rounded-full bg-[#D10069]"
          style={{
            height: `${h * 5}px`,
            animation: "micBar 0.7s ease-in-out infinite alternate",
            animationDelay: `${idx * 0.08}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes micBar {
          from { transform: scaleY(0.4); opacity: 0.6; }
          to { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function StepIndicator({ current, max }: { current: number; max: number }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            i < current ? "bg-[#D10069]" : "bg-gray-200"
          )}
        />
      ))}
    </div>
  );
}

/** Render inline markdown: **bold** → <strong> */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-semibold text-[var(--digi-navy)]">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

/** Render debrief with bold headers and bullet lists */
function DebriefContent({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bullets.length === 0) return;
    elements.push(
      <ul key={key++} className="list-disc pl-5 space-y-1 my-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="text-sm leading-relaxed">{renderInline(b)}</li>
        ))}
      </ul>
    );
    bullets = [];
  };

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("- ") || t.startsWith("• ")) {
      bullets.push(t.replace(/^[-•]\s+/, ""));
    } else {
      flushBullets();
      if (!t) {
        elements.push(<div key={key++} className="h-1.5" />);
      } else {
        elements.push(
          <p key={key++} className="text-sm leading-relaxed">
            {renderInline(t)}
          </p>
        );
      }
    }
  }
  flushBullets();
  return <div className="space-y-0.5">{elements}</div>;
}

export interface InterviewEngineProps {
  scenario: InterviewScenario;
  aiConfig: AIConfig;
  voiceEnabled: boolean;
  lang: "fr" | "en";
  userDisplayName: string;
  userAvatarUrl: string | null;
  demoMode?: boolean;
  onReset: () => void;
}

export function InterviewEngine({
  scenario,
  aiConfig,
  voiceEnabled,
  lang,
  userDisplayName,
  userAvatarUrl,
  demoMode = false,
  onReset,
}: InterviewEngineProps) {
  const router = useRouter();
  const isEn = lang === "en";
  const speechLang = isEn ? "en-US" : "fr-FR";

  const [state, dispatch] = useReducer(interviewEngineReducer, initialInterviewEngineState);
  const [textFallback, setTextFallback] = useState("");
  const [micDenied, setMicDenied] = useState(false);

  const stateRef = useRef(state);
  const voiceEnabledRef = useRef(voiceEnabled);
  const inFlightRef = useRef(false);
  const bootedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);
  // Auto-scroll to the latest message whenever messages list or phase changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.phase]);

  const submitAnswerStable = useRef<(raw: string) => void>(() => {});

  const onTranscript = useCallback((text: string) => {
    dispatch({ type: "UPDATE_TRANSCRIPT", live: text });
    setTextFallback(text);
  }, []);

  const onSilenceSubmit = useCallback((text: string) => {
    if (stateRef.current.phase === "listening") {
      submitAnswerStable.current(text);
    }
  }, []);

  const friendlyError = useCallback(
    (raw: string): string => {
      if (/429|rate.?limit|quota/i.test(raw))
        return isEn
          ? "AI quota reached — try again in a moment."
          : "Quota IA atteint — réessayez dans un instant.";
      if (/404|not.?found/i.test(raw))
        return isEn ? "AI model unavailable." : "Modèle IA indisponible.";
      if (/network|fetch|ECONNREFUSED/i.test(raw))
        return isEn
          ? "Network error — check your connection."
          : "Erreur réseau — vérifiez votre connexion.";
      return raw;
    },
    [isEn]
  );

  const onRecognitionError = useCallback(
    (message: string) => {
      setMicDenied(true);
      dispatch({ type: "CLEAR_ERROR" });
      toast({
        title: isEn ? "Voice input" : "Entrée vocale",
        description: message,
        variant: "destructive",
      });
    },
    [isEn]
  );

  const retryMic = useCallback(async () => {
    const result = await requestMicrophoneAccess();
    if (result.ok) {
      setMicDenied(false);
    } else {
      toast({
        title: isEn ? "Mic denied" : "Micro refusé",
        description: result.error ?? (isEn ? "Check your browser settings." : "Vérifiez les paramètres du navigateur."),
        variant: "destructive",
      });
    }
  }, [isEn]);

  const { start: startRecognition, stop: stopRecognition, isRunning } =
    useInterviewRecognition(speechLang, {
      onTranscript,
      onSilenceSubmit,
      onError: onRecognitionError,
    });

  submitAnswerStable.current = (raw: string) => {
    const answer = raw.trim();
    if (!answer || stateRef.current.phase !== "listening") return;
    stopRecognition();
    cancelSpeech();
    dispatch({ type: "SUBMIT_ANSWER", answer });
    setTextFallback("");
  };

  const runBoot = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      // Run mic permission and AI call in parallel — mic dialog must not block AI load
      const micTimeout = new Promise<{ ok: boolean }>((resolve) =>
        setTimeout(() => resolve({ ok: true }), 5000)
      );
      const [micResult, aiResult] = await Promise.allSettled([
        Promise.race([requestMicrophoneAccess(), micTimeout]),
        startInterviewSimulation({ scenario, config: aiConfig, demoMode }),
      ]);

      if (micResult.status === "fulfilled" && !micResult.value.ok) setMicDenied(true);

      if (aiResult.status === "rejected") {
        dispatch({
          type: "BOOT_FAILED",
          error: friendlyError(
            aiResult.reason instanceof Error ? aiResult.reason.message : "Démarrage impossible"
          ),
        });
        return;
      }
      const result = aiResult.value;
      if (!result.ok) {
        dispatch({ type: "BOOT_FAILED", error: friendlyError(result.error) });
        return;
      }
      dispatch({ type: "ASSISTANT_REPLY", content: result.reply });
    } catch (e) {
      dispatch({
        type: "BOOT_FAILED",
        error: friendlyError(e instanceof Error ? e.message : "Démarrage impossible"),
      });
    } finally {
      inFlightRef.current = false;
    }
  }, [aiConfig, scenario, demoMode, friendlyError]);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    // Pre-warm TTS voice list so first speakText call has no latency
    prewarmVoices();
    void runBoot();
  }, [runBoot]);

  useEffect(() => {
    if (state.phase !== "speaking" || !state.currentQuestion) return;

    if (!voiceEnabledRef.current) {
      dispatch({ type: "SPEAK_DONE" });
      return;
    }

    cancelSpeech();
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    speakText(state.currentQuestion, {
      rate: 1.1,    // 1.1 = natural cadence, clearly intelligible
      pitch: 1.0,
      lang: speechLang,
      onEnd: () => {
        if (safetyTimer) clearTimeout(safetyTimer);
        dispatch({ type: "SPEAK_DONE" });
      },
    });

    // 30 s fallback — Chrome sometimes never fires onend; generous window for long responses
    safetyTimer = setTimeout(() => dispatch({ type: "SPEAK_DONE" }), 30_000);

    return () => {
      cancelSpeech();
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, [state.phase, state.currentQuestion, speechLang]);

  useEffect(() => {
    if (state.phase !== "listening") {
      stopRecognition();
      return;
    }
    if (micDenied) return;

    const timer = window.setTimeout(() => startRecognition(), LISTENING_START_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      stopRecognition();
    };
  }, [state.phase, micDenied, startRecognition, stopRecognition]);

  useEffect(() => {
    if (state.phase !== "processing" || !state.pendingAnswer) return;
    if (inFlightRef.current) return;

    const run = async () => {
      inFlightRef.current = true;
      try {
        if (state.pendingAnswer === "__FINISH__") {
          const result = await finishInterviewSimulation({
            scenario,
            messages: state.messages,
            config: aiConfig,
            demoMode,
          });
          if (!result.ok) {
            const msg = friendlyError(result.error);
            dispatch({ type: "TURN_FAILED", error: msg });
            toast({
              title: isEn ? "Debrief failed" : "Débrief impossible",
              description: msg,
              variant: "destructive",
            });
            return;
          }
          dispatch({ type: "DEBRIEF_READY", content: result.reply });
          return;
        }

        const result = await continueInterviewSimulation({
          scenario,
          messages: state.messages,
          config: aiConfig,
          demoMode,
        });
        if (!result.ok) {
          const msg = friendlyError(result.error);
          dispatch({ type: "TURN_FAILED", error: msg });
          toast({
            title: "Erreur",
            description: msg,
            variant: "destructive",
          });
          return;
        }
        dispatch({ type: "ASSISTANT_REPLY", content: result.reply });
      } catch (e) {
        dispatch({
          type: "TURN_FAILED",
          error: friendlyError(e instanceof Error ? e.message : "Erreur réseau"),
        });
      } finally {
        // Guaranteed reset — prevents permanent lock if exception thrown
        inFlightRef.current = false;
      }
    };

    void run();
  }, [
    state.phase,
    state.pendingAnswer,
    state.messages,
    scenario,
    aiConfig,
    demoMode,
    isEn,
    friendlyError,
  ]);

  const handleSkipSpeech = () => {
    cancelSpeech();
    dispatch({ type: "SPEAK_DONE" });
  };

  const finishInterview = () => {
    if (state.userTurns < 1) {
      toast({
        title: isEn ? "Too short" : "Conversation trop courte",
        description: isEn ? "Answer at least one question." : "Répondez au moins une fois.",
        variant: "destructive",
      });
      return;
    }
    stopRecognition();
    cancelSpeech();
    dispatch({ type: "REQUEST_FINISH" });
  };

  const phaseLabel = PHASE_LABELS[state.phase]?.[isEn ? "en" : "fr"] ?? state.phase;
  const inputValue =
    state.phase === "listening" ? state.liveTranscript || textFallback : textFallback;
  const inputDisabled = state.phase === "processing" || state.phase === "speaking";

  if (state.phase === "error") {
    return (
      <div className="p-6 space-y-4 text-center">
        <p className="text-sm text-red-700">{state.error}</p>
        <Button type="button" variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          {isEn ? "Back" : "Retour"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="border-b px-4 py-2 flex flex-wrap items-center justify-between gap-2 bg-white/80">
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5",
            state.phase === "listening" && "bg-red-100 text-red-800",
            state.phase === "processing" && "bg-amber-100 text-amber-900",
            state.phase === "speaking" && "bg-blue-100 text-blue-900",
            state.phase === "booting" && "bg-gray-100 text-gray-700",
            state.phase === "complete" && "bg-green-100 text-green-800"
          )}
          aria-live="polite"
        >
          {state.phase === "listening" && <Mic className="h-3 w-3" aria-hidden />}
          {state.phase === "speaking" && <Volume2 className="h-3 w-3" aria-hidden />}
          {state.phase === "processing" && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
          {phaseLabel}
        </span>
        <span className="text-xs text-muted-foreground">
          {isEn ? "Turn" : "Tour"} {state.userTurns}/{INTERVIEW_MAX_TURNS}
        </span>
      </div>

      <div className="px-4 pt-2">
        <StepIndicator current={state.userTurns} max={INTERVIEW_MAX_TURNS} />
      </div>

      <div className="h-[min(440px,45svh)] overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-[var(--digi-surface)]/40">
        {state.messages.map((msg, i) => (
          <MessageBubble
            key={`${i}-${msg.role}`}
            msg={msg}
            isUser={msg.role === "user"}
            userAvatarUrl={userAvatarUrl}
            userDisplayName={userDisplayName}
            highlight={
              state.phase === "speaking" &&
              msg.role === "assistant" &&
              i === state.messages.length - 1
            }
          />
        ))}

        {state.phase === "booting" && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isEn ? "Preparing your interview…" : "Préparation de l'entretien…"}
          </p>
        )}

        {state.phase === "processing" && (
          <div className="flex items-end gap-2">
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#030A8C] to-[#D10069] flex items-center justify-center shrink-0"
              aria-hidden
            >
              <span className="text-lg">👩‍💼</span>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {state.phase === "speaking" && (
          <Button type="button" size="sm" variant="ghost" onClick={handleSkipSpeech}>
            {isEn ? "Skip voice" : "Passer la voix"}
          </Button>
        )}
        {/* Scroll sentinel — always at the bottom of the message list */}
        <div ref={messagesEndRef} aria-hidden />
      </div>

      {state.phase === "complete" && state.debrief && (
        <div className="mx-2 sm:mx-4 mb-4 border rounded-xl p-4 sm:p-5 bg-gradient-to-br from-[#030A8C]/5 to-[#D10069]/5">
          <h3 className="font-semibold flex items-center gap-2 mb-3 text-[var(--digi-navy)]">
            <Star size={18} className="text-[#D10069]" aria-hidden />
            {isEn ? "Interview debrief" : "Bilan de l'entretien"}
          </h3>
          <DebriefContent text={state.debrief} />
          <div className="flex flex-wrap gap-2 mt-4">
            <Button type="button" className="btn-digi-primary text-sm" onClick={onReset}>
              {isEn ? "Restart" : "Recommencer"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-sm"
              onClick={() => router.push("/candidatures")}
            >
              {isEn ? "My applications →" : "Mes candidatures →"}
            </Button>
          </div>
        </div>
      )}

      {state.phase !== "complete" && (
        <div className="border-t bg-white">
          {/* Speaking phase — show what the recruiter is saying */}
          {state.phase === "speaking" && state.currentQuestion && (
            <div className="px-4 pt-3 pb-1">
              <p className="text-sm text-[var(--digi-navy)] bg-blue-50/80 rounded-lg px-3 py-2 border border-blue-100">
                <Volume2 className="inline h-4 w-4 mr-1 text-[#030A8C]" aria-hidden />
                {state.currentQuestion}
              </p>
            </div>
          )}

          {/* Errors / warnings */}
          {state.error && (
            <div className="px-4 pt-3 pb-0">
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
            </div>
          )}
          {micDenied && (
            <div className="px-4 pt-3 pb-0 flex items-center gap-2">
              <p className="flex-1 text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                {isEn ? "Mic unavailable — type your answer below." : "Micro indisponible — tapez votre réponse ci-dessous."}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 text-xs"
                onClick={() => void retryMic()}
              >
                {isEn ? "Retry mic" : "Réessayer"}
              </Button>
            </div>
          )}

          {/* Listening phase — mic is auto-managed, just show status */}
          {state.phase === "listening" && !micDenied && (
            <div className="flex flex-col items-center gap-2 pt-3 pb-1">
              {isRunning() ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    <span className="absolute inset-0 rounded-full bg-[#D10069]/20 animate-ping" aria-hidden />
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#D10069] to-[#ff4d9d] flex items-center justify-center shadow-md shadow-[#D10069]/30">
                      <Mic className="h-5 w-5 text-white" aria-hidden />
                    </div>
                  </div>
                  <MicPulse listening />
                  <p className="text-xs text-[#D10069] font-medium">
                    {isEn ? "Listening… speak now" : "Micro ouvert — parlez maintenant"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isEn ? "Auto-submits after 3s silence" : "Envoi automatique après 3s de silence"}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  {isEn ? "Opening mic…" : "Ouverture du micro…"}
                </div>
              )}
            </div>
          )}

          {/* Text input row — always available */}
          <div className="flex gap-2 items-end px-4 pb-3 pt-2">
            <textarea
              value={inputValue}
              onChange={(e) => setTextFallback(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !inputDisabled) {
                  e.preventDefault();
                  submitAnswerStable.current(inputValue);
                }
              }}
              disabled={inputDisabled}
              placeholder={
                state.phase === "listening" && isRunning()
                  ? (isEn ? "Mic active — or type here" : "Micro actif — ou tapez ici")
                  : (isEn ? "Type your answer… (Enter to send)" : "Tapez votre reponse… (Entree pour envoyer)")
              }
              className="flex-1 border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#030A8C]/20 disabled:opacity-60"
              rows={2}
            />
            <button
              type="button"
              