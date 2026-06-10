"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Loader2, Mic, MicOff, RotateCcw, Send, Star, Volume2 } from "lucide-react";
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
import { cancelSpeech, requestMicrophoneAccess, speakText } from "@/lib/speech-tts";
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

function Waveform() {
  return (
    <div className="flex items-end gap-0.5 h-5" aria-hidden>
      {[1, 2, 3, 4, 3].map((h, idx) => (
        <div
          key={idx}
          className="w-1 bg-[#D10069] rounded-full animate-pulse"
          style={{
            height: `${h * 4}px`,
            animationDelay: `${idx * 0.1}s`,
            animationDuration: "0.8s",
          }}
        />
      ))}
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

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

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
      const access = await requestMicrophoneAccess();
      if (!access.ok) setMicDenied(true);

      const result = await startInterviewSimulation({ scenario, config: aiConfig, demoMode });
      if (!result.ok) {
        dispatch({ type: "BOOT_FAILED", error: result.error });
        return;
      }
      dispatch({ type: "ASSISTANT_REPLY", content: result.reply });
    } catch (e) {
      dispatch({
        type: "BOOT_FAILED",
        error: e instanceof Error ? e.message : "Démarrage impossible",
      });
    } finally {
      inFlightRef.current = false;
    }
  }, [aiConfig, scenario, demoMode]);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    void runBoot();
  }, [runBoot]);

  useEffect(() => {
    if (state.phase !== "speaking" || !state.currentQuestion) return;

    if (!voiceEnabledRef.current) {
      dispatch({ type: "SPEAK_DONE" });
      return;
    }

    cancelSpeech();
    speakText(state.currentQuestion, {
      rate: 1.1,
      pitch: 1.02,
      onEnd: () => dispatch({ type: "SPEAK_DONE" }),
    });

    return () => cancelSpeech();
  }, [state.phase, state.currentQuestion]);

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
            dispatch({ type: "TURN_FAILED", error: result.error });
            toast({
              title: isEn ? "Debrief failed" : "Débrief impossible",
              description: result.error,
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
          dispatch({ type: "TURN_FAILED", error: result.error });
          toast({
            title: "Erreur",
            description: result.error,
            variant: "destructive",
          });
          return;
        }
        dispatch({ type: "ASSISTANT_REPLY", content: result.reply });
      } catch (e) {
        dispatch({
          type: "TURN_FAILED",
          error: e instanceof Error ? e.message : "Erreur réseau",
        });
      } finally {
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
            "text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full",
            state.phase === "listening" && "bg-red-100 text-red-800",
            state.phase === "processing" && "bg-amber-100 text-amber-900",
            state.phase === "speaking" && "bg-blue-100 text-blue-900",
            state.phase === "booting" && "bg-gray-100 text-gray-700"
          )}
        >
          {phaseLabel}
        </span>
        <span className="text-xs text-muted-foreground">
          {isEn ? "Turn" : "Tour"} {state.userTurns}/{INTERVIEW_MAX_TURNS}
        </span>
      </div>

      <div className="px-4 pt-2">
        <StepIndicator current={state.userTurns} max={INTERVIEW_MAX_TURNS} />
      </div>

      <div className="h-[min(380px,45vh)] overflow-y-auto p-4 space-y-4 bg-[var(--digi-surface)]/40">
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
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {PHASE_LABELS.processing[isEn ? "en" : "fr"]}
          </p>
        )}

        {state.phase === "listening" && !micDenied && <Waveform />}

        {state.phase === "speaking" && (
          <Button type="button" size="sm" variant="ghost" onClick={handleSkipSpeech}>
            {isEn ? "Skip voice" : "Passer la voix"}
          </Button>
        )}
      </div>

      {state.phase === "complete" && state.debrief && (
        <div className="mx-4 mb-4 border rounded-xl p-5 bg-gradient-to-br from-[#030A8C]/5 to-[#D10069]/5">
          <h3 className="font-semibold flex items-center gap-2 mb-3 text-[var(--digi-navy)]">
            <Star size={18} className="text-[#D10069]" aria-hidden />
            {isEn ? "Interview debrief" : "Bilan de l'entretien"}
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-line">{state.debrief}</p>
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
        <div className="border-t p-4 space-y-3 bg-white">
          {state.phase === "speaking" && state.currentQuestion && (
            <p className="text-sm text-[var(--digi-navy)] bg-blue-50/80 rounded-lg px-3 py-2 border border-blue-100">
              <Volume2 className="inline h-4 w-4 mr-1 text-[#030A8C]" aria-hidden />
              {state.currentQuestion}
            </p>
          )}

          {state.error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
          )}

          {micDenied && (
            <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
              {isEn
                ? "Micro unavailable — type your answers below."
                : "Micro indisponible — répondez par le champ texte ci-dessous."}
            </p>
          )}

          <p className="text-xs text-muted-foreground font-medium">
            {isEn ? "Text fallback (always available)" : "Répondre par texte (toujours disponible)"}
          </p>

          <div className="flex gap-2 items-end">
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
                isEn
                  ? "Type your answer… (Enter to send)"
                  : "Tapez votre réponse… (Entrée pour envoyer)"
              }
              className="flex-1 border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#030A8C]/20 disabled:opacity-60"
              rows={2}
            />
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={inputDisabled || micDenied || state.phase !== "listening"}
                onClick={() => {
                  if (isRunning()) stopRecognition();
                  else startRecognition();
                }}
                title={isEn ? "Microphone" : "Microphone"}
              >
                {isRunning() ? (
                  <Mic className="h-4 w-4 text-[var(--digi-accent)]" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </Button>
              <button
                type="button"
                disabled={inputDisabled || !inputValue.trim()}
                onClick={() => submitAnswerStable.current(inputValue)}
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#030A8C] to-[#D10069] text-white flex items-center justify-center disabled:opacity-50"
                aria-label={isEn ? "Send" : "Envoyer"}
              >
                <Send size={16} aria-hidden />
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={state.userTurns < 1 || state.phase === "processing"}
              onClick={finishInterview}
            >
              {isEn ? "Finish" : "Terminer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  isUser,
  userAvatarUrl,
  userDisplayName,
  highlight,
}: {
  msg: InterviewMessage;
  isUser: boolean;
  userAvatarUrl: string | null;
  userDisplayName: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn("flex items-end gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
      {isUser ? (
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
          {userAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userAvatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#030A8C] to-[#D10069] flex items-center justify-center text-white text-xs font-bold">
              {userDisplayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ) : (
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-[#030A8C] to-[#D10069] flex items-center justify-center shrink-0"
          aria-hidden
        >
          <span className="text-lg">👩‍💼</span>
        </div>
      )}
      <div
        className={cn(
          "max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
          isUser
            ? "bg-[#030A8C] text-white rounded-br-sm"
            : "bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-sm",
          highlight && "ring-2 ring-[#D10069]/30"
        )}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
}
