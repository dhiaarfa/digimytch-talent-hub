"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  MessageSquare,
  Loader2,
  RotateCcw,
  Volume2,
  Send,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useApiKeys, useDefaultModel } from "@/hooks/use-api-keys";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useMediaStt } from "@/hooks/use-media-stt";
import { useLanguage } from "@/lib/use-language";
import {
  getInterviewSttFallbackMessage,
  getSpeechRecognitionSupport,
} from "@/lib/browser-speech";
import {
  cancelSpeech,
  requestMicrophoneAccess,
  speakText,
} from "@/lib/speech-tts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClientOnly } from "@/components/ui/client-only";
import {
  INTERVIEW_MAX_TURNS,
  type InterviewMessage,
  type InterviewScenario,
} from "@/lib/interview-simulator";
import type { InterviewSetupData } from "@/utils/actions/digimytch/interview-simulator";
import {
  continueInterviewSimulation,
  finishInterviewSimulation,
  startInterviewSimulation,
} from "@/utils/actions/digimytch/interview-simulator";

const SILENCE_SEND_MS = 2000;
const MIN_SPEECH_CHARS = 2;

function countUserTurns(messages: InterviewMessage[]) {
  return messages.filter((m) => m.role === "user").length;
}

function AIAvatar() {
  return (
    <div
      className="w-9 h-9 rounded-full bg-gradient-to-br from-[#030A8C] to-[#D10069] flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm"
      aria-hidden
    >
      <span className="text-lg leading-none" role="img" aria-label="Recruteuse">
        👩‍💼
      </span>
    </div>
  );
}

function UserAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl?: string | null;
  name: string;
}) {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#030A8C] to-[#D10069] flex items-center justify-center text-white text-xs font-bold">
          {name?.charAt(0)?.toUpperCase() || "M"}
        </div>
      )}
    </div>
  );
}

function SpeakingText({ text, charIndex }: { text: string; charIndex: number }) {
  return (
    <span>
      <span className="text-gray-900">{text.substring(0, charIndex)}</span>
      <span className="text-gray-300">{text.substring(charIndex)}</span>
      <span
        className="inline-block w-1 h-4 bg-[#D10069] animate-pulse ml-0.5 align-middle"
        aria-hidden
      />
    </span>
  );
}

export function InterviewSimulatorPanel({ setup }: { setup: InterviewSetupData }) {
  const router = useRouter();
  const { apiKeys } = useApiKeys();
  const { defaultModel } = useDefaultModel();
  const { lang, isEn } = useLanguage();
  const speechLang = isEn ? "en-US" : "fr-FR";
  const sttLang = lang;

  const [scenarioMode, setScenarioMode] = useState<"profile" | "job">("profile");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [customRole, setCustomRole] = useState(setup.defaultTargetRole);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const [phase, setPhase] = useState<"setup" | "live" | "debrief">("setup");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [conversationMode, setConversationMode] = useState(true);
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const [micChecking, setMicChecking] = useState(false);
  const [showMicInstructions, setShowMicInstructions] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenUpTo, setSpokenUpTo] = useState(0);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<number | null>(null);
  const [debriefText, setDebriefText] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationModeRef = useRef(conversationMode);
  const shouldListenRef = useRef(false);
  const loadingRef = useRef(false);
  const phaseRef = useRef<"setup" | "live" | "debrief">("setup");
  const textInputRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSendRef = useRef<() => Promise<void>>(async () => {});

  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported: speechSupported,
    error: speechError,
    startListening: startSpeechEngine,
    stopListening: stopSpeechEngine,
    resetTranscript: resetSpeechTranscript,
  } = useSpeechRecognition(speechLang);

  /** Web Speech (gratuit) par défaut ; Whisper OpenRouter si solde audio ≥ 0,50 $. */
  const [sttMode, setSttMode] = useState<"browser" | "openrouter">("browser");
  const [sttAutoHint, setSttAutoHint] = useState<string | null>(null);
  const [browserSttHint, setBrowserSttHint] = useState("");
  const useWhisperStt = sttMode === "openrouter";

  const forceBrowserStt = useCallback(() => {
    setSttMode("browser");
    setSttAutoHint(
      isEn
        ? "OpenRouter audio credits too low — using free Chrome/Edge mic."
        : "Crédits audio OpenRouter insuffisants — micro Chrome utilisé automatiquement."
    );
  }, [isEn]);

  const {
    isRecording: mediaRecording,
    error: mediaSttError,
    startRecording: startMediaStt,
    stopRecording: stopMediaStt,
  } = useMediaStt(sttLang, forceBrowserStt);

  const displayError = speechError || mediaSttError;
  const micActive = isListening || mediaRecording;

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShowMicInstructions(!localStorage.getItem("mic-instructions-seen"));
    const support = getSpeechRecognitionSupport();
    const fallback = getInterviewSttFallbackMessage(isEn);
    setBrowserSttHint(fallback);
    if (!support.supported && fallback) {
      setConversationMode(false);
    }
  }, [isEn]);

  /** Détection auto : pas assez de crédits OpenRouter → micro navigateur */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/openrouter/capabilities")
      .then((r) => r.json())
      .then((data: { audioSttAvailable?: boolean; hint?: string }) => {
        if (cancelled) return;
        if (!data.audioSttAvailable) {
          setSttMode("browser");
          if (data.hint) setSttAutoHint(data.hint);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (transcript) {
      setTextInput((prev) => {
        const next = `${prev} ${transcript}`.trim();
        textInputRef.current = next;
        return next;
      });
      resetSpeechTranscript();
    }
  }, [transcript, resetSpeechTranscript]);

  const scheduleAutoSend = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (!conversationModeRef.current) return;
    silenceTimerRef.current = setTimeout(() => {
      const text = textInputRef.current.trim();
      if (
        text.length >= MIN_SPEECH_CHARS &&
        !loadingRef.current &&
        phaseRef.current === "live"
      ) {
        void handleSendRef.current();
      }
    }, SILENCE_SEND_MS);
  }, []);

  useEffect(() => {
    textInputRef.current = textInput;
    if (micActive && textInput.trim()) {
      scheduleAutoSend();
    }
  }, [textInput, micActive, scheduleAutoSend]);

  const buildScenario = useCallback((): InterviewScenario => {
    if (scenarioMode === "job" && selectedJobId) {
      const job = setup.jobs.find((j) => j.id === selectedJobId);
      if (job) {
        return {
          targetRole: job.title || customRole,
          company: job.company,
          jobTitle: job.title,
          jobId: job.id,
        };
      }
    }
    return { targetRole: customRole.trim() || setup.defaultTargetRole };
  }, [scenarioMode, selectedJobId, customRole, setup]);

  const aiConfig = { model: defaultModel, apiKeys };

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    conversationModeRef.current = conversationMode;
  }, [conversationMode]);
  useEffect(() => {
    textInputRef.current = textInput;
  }, [textInput]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, isSpeaking, spokenUpTo]);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const appendTranscript = useCallback((text: string) => {
    setTextInput((prev) => {
      const next = `${prev} ${text}`.trim();
      textInputRef.current = next;
      return next;
    });
  }, []);

  const startListening = useCallback(async () => {
    if (isListening || mediaRecording || loadingRef.current || phaseRef.current !== "live") {
      return;
    }
    shouldListenRef.current = true;

    if (useWhisperStt) {
      await startMediaStt(appendTranscript);
      return;
    }

    if (!speechSupported) {
      toast({
        title: "Micro non supporté",
        description: "Utilisez Chrome ou Edge, ou activez la transcription OpenRouter.",
        variant: "destructive",
      });
      return;
    }
    startSpeechEngine();
  }, [
    appendTranscript,
    isListening,
    mediaRecording,
    speechSupported,
    startMediaStt,
    startSpeechEngine,
  ]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    void stopMediaStt();
    stopSpeechEngine();
  }, [stopMediaStt, stopSpeechEngine]);

  const resumeMicAfterAssistant = useCallback(() => {
    if (
      !conversationModeRef.current ||
      phaseRef.current !== "live" ||
      micGranted !== true
    ) {
      return;
    }
    shouldListenRef.current = true;
    window.setTimeout(() => void startListening(), 450);
  }, [micGranted, startListening]);

  const speakAssistantMessage = useCallback(
    (text: string, messageIndex: number) => {
      if (!voiceEnabled || typeof window === "undefined") {
        resumeMicAfterAssistant();
        return;
      }
      stopListening();
      setCurrentSpeakingId(messageIndex);
      setSpokenUpTo(0);
      setIsSpeaking(true);

      speakText(text, {
        rate: 1.15,
        pitch: 1.05,
        onStart: () => {
          setIsSpeaking(true);
          setCurrentSpeakingId(messageIndex);
        },
        onWordBoundary: (charIndex) => setSpokenUpTo(charIndex),
        onEnd: () => {
          setIsSpeaking(false);
          setSpokenUpTo(text.length);
          setCurrentSpeakingId(null);
          resumeMicAfterAssistant();
        },
      });
    },
    [resumeMicAfterAssistant, stopListening, voiceEnabled]
  );

  const appendAssistant = useCallback(
    (content: string) => {
      setMessages((prev) => {
        const idx = prev.length;
        queueMicrotask(() => speakAssistantMessage(content, idx));
        return [...prev, { role: "assistant", content }];
      });
    },
    [speakAssistantMessage]
  );

  const handleSkipSpeech = () => {
    cancelSpeech();
    setIsSpeaking(false);
    setCurrentSpeakingId(null);
    resumeMicAfterAssistant();
  };

  const handleTestMicrophone = async () => {
    setMicChecking(true);
    const result = await requestMicrophoneAccess();
    setMicGranted(result.ok);
    setMicChecking(false);
    if (result.ok) {
      toast({ title: "Micro OK", description: "Le microphone est autorisé." });
    } else {
      toast({
        title: "Micro refusé",
        description: result.error ?? "Autorisez le micro pour ce site.",
        variant: "destructive",
      });
    }
  };

  const handleStart = async () => {
    const scenario = buildScenario();
    if (!scenario.targetRole.trim()) {
      toast({ title: "Poste requis", description: "Indiquez le poste visé.", variant: "destructive" });
      return;
    }

    let micOk = micGranted === true;
    if (conversationMode && micGranted !== true) {
      const access = await requestMicrophoneAccess();
      micOk = access.ok;
      setMicGranted(access.ok);
      if (!access.ok) {
        toast({
          title: "Mode texte disponible",
          description:
            access.error ??
            "Vous pouvez répondre par le champ texte en bas.",
        });
      }
    }

    setLoading(true);
    setMessages([]);
    setTextInput("");
    textInputRef.current = "";
    setDebriefText(null);
    setPhase("live");
    phaseRef.current = "live";
    shouldListenRef.current = conversationMode && micOk;

    const result = await startInterviewSimulation({ scenario, config: aiConfig });
    setLoading(false);

    if (!result.ok) {
      toast({ title: "Simulation impossible", description: result.error, variant: "destructive" });
      setPhase("setup");
      phaseRef.current = "setup";
      shouldListenRef.current = false;
      return;
    }

    appendAssistant(result.reply);
    if (conversationMode && micOk && !voiceEnabled) {
      resumeMicAfterAssistant();
    }
  };

  const handleSendMessage = async (raw?: string) => {
    const text = (raw ?? textInputRef.current).trim();
    if (!text || loading || phase !== "live") return;

    clearSilenceTimer();
    stopListening();
    resetSpeechTranscript();

    const scenario = buildScenario();
    const nextMessages: InterviewMessage[] = [...messages, { role: "user", content: text }];
    setTextInput("");
    textInputRef.current = "";
    setMessages(nextMessages);
    setLoading(true);

    const result = await continueInterviewSimulation({
      scenario,
      messages: nextMessages,
      config: aiConfig,
    });
    setLoading(false);

    if (!result.ok) {
      toast({ title: "Erreur", description: result.error, variant: "destructive" });
      shouldListenRef.current = conversationMode;
      if (conversationMode) void startListening();
      return;
    }

    shouldListenRef.current = conversationMode;
    appendAssistant(result.reply);
  };

  handleSendRef.current = () => handleSendMessage();

  const handleFinish = async () => {
    if (messages.length < 2) {
      toast({
        title: "Conversation trop courte",
        description: "Échangez au moins une fois.",
        variant: "destructive",
      });
      return;
    }
    stopListening();
    cancelSpeech();
    setLoading(true);
    const result = await finishInterviewSimulation({
      scenario: buildScenario(),
      messages,
      config: aiConfig,
    });
    setLoading(false);
    if (!result.ok) {
      toast({ title: "Débrief impossible", description: result.error, variant: "destructive" });
      return;
    }
    shouldListenRef.current = false;
    setPhase("debrief");
    phaseRef.current = "debrief";
    setDebriefText(result.reply);
    setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    speakAssistantMessage(result.reply, messages.length);
  };

  const handleReset = () => {
    stopListening();
    cancelSpeech();
    setMessages([]);
    setTextInput("");
    setDebriefText(null);
    setPhase("setup");
    phaseRef.current = "setup";
    setIsSpeaking(false);
    setCurrentSpeakingId(null);
  };

  useEffect(
    () => () => {
      stopListening();
      cancelSpeech();
      clearSilenceTimer();
    },
    [stopListening]
  );

  const userTurns = countUserTurns(messages);

  return (
    <div className="space-y-4">
      <Card className="border-[var(--digi-border)] bg-white/90 overflow-hidden">
        <div className="border-b px-4 py-3 flex flex-wrap justify-between gap-2 bg-gradient-to-r from-[var(--color-primary-blue)]/5 to-[var(--color-accent-magenta)]/5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[var(--digi-accent)]" />
            <div>
              <p className="font-semibold text-[var(--digi-navy)]">Simulateur d&apos;entretien</p>
              <p className="text-xs text-[var(--digi-muted)]">Vocal ou texte — questions courtes</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={conversationMode ? "default" : "outline"}
              className={conversationMode ? "bg-[var(--digi-navy)]" : ""}
              onClick={() => setConversationMode((v) => !v)}
            >
              <Mic className="h-4 w-4 mr-1" />
              {conversationMode ? "Auto : activé" : "Auto : désactivé"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={voiceEnabled ? "default" : "outline"}
              className={voiceEnabled ? "bg-[var(--digi-accent)]" : ""}
              onClick={() => {
                if (voiceEnabled) cancelSpeech();
                setVoiceEnabled((v) => !v);
              }}
            >
              <Volume2 className="h-4 w-4 mr-1" />
              {voiceEnabled ? "Voix : activée" : "Voix : désactivée"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              title={
                sttMode === "browser"
                  ? "Micro navigateur (gratuit). Cliquez pour OpenRouter Whisper (≥ 0,50 $ crédits)."
                  : "OpenRouter Whisper. Cliquez pour revenir au micro navigateur."
              }
              onClick={() =>
                setSttMode((m) => (m === "browser" ? "openrouter" : "browser"))
              }
            >
              STT : {sttMode === "browser" ? "Chrome" : "OpenRouter"}
            </Button>
            {sttAutoHint && (
              <p className="text-xs text-muted-foreground max-w-md" title={sttAutoHint}>
                {sttAutoHint}
              </p>
            )}
            {browserSttHint && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-lg">
                {browserSttHint}
              </p>
            )}
            {phase !== "setup" && (
              <Button type="button" size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Recommencer
              </Button>
            )}
          </div>
        </div>

        {displayError && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700 font-medium">⚠️ {displayError}</p>
            {displayError.includes("réseau") && (
              <div className="mt-2 text-xs text-red-600 space-y-1">
                <p>• Vérifiez que vous avez accès à internet</p>
                <p>• La reconnaissance vocale Chrome nécessite une connexion aux serveurs Google</p>
                <p>• Désactivez votre VPN si actif</p>
                <p>• Alternative : utilisez le mode texte ci-dessous</p>
              </div>
            )}
            {displayError.includes("refusé") && (
              <div className="mt-2 text-xs text-red-600">
                <p>
                  Dans Chrome : cliquez sur 🔒 dans la barre d&apos;adresse → Microphone →
                  Autoriser
                </p>
              </div>
            )}
          </div>
        )}

        {phase === "setup" && (
          <div className="p-4 space-y-4">
            {showMicInstructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-sm text-blue-800 mb-2">Avant de démarrer</h4>
                <ul className="text-xs text-blue-700 space-y-1 list-none">
                  <li>• Chrome / Edge : reconnaissance vocale gratuite (Web Speech API)</li>
                  <li>• Firefox / Safari : utilisez le champ texte ou STT OpenRouter (crédits)</li>
                  <li>• Autorisez le micro quand le navigateur le demande</li>
                  <li>• Connexion internet requise pour la voix navigateur</li>
                  <li>• Parlez clairement ; une pause envoie en mode auto</li>
                </ul>
                {browserSttHint && (
                  <p className="mt-2 text-xs text-amber-800">{browserSttHint}</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowMicInstructions(false);
                    localStorage.setItem("mic-instructions-seen", "1");
                  }}
                  className="mt-3 text-xs text-blue-600 underline"
                >
                  Compris, ne plus afficher
                </button>
              </div>
            )}

            <ClientOnly
              fallback={
                <Button type="button" variant="outline" className="w-full" disabled>
                  <Mic className="h-4 w-4 mr-2" />
                  Tester le microphone
                </Button>
              }
            >
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={micChecking}
                onClick={() => void handleTestMicrophone()}
              >
                {micChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mic className="h-4 w-4 mr-2" />
                )}
                {micGranted === true
                  ? "Micro autorisé ✓"
                  : micGranted === false
                    ? "Réessayer l'accès au micro"
                    : "Tester le microphone"}
              </Button>
            </ClientOnly>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Mode de simulation</Label>
                <Select
                  value={scenarioMode}
                  onValueChange={(v) => setScenarioMode(v as "profile" | "job")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profile">Basé sur mon profil</SelectItem>
                    <SelectItem value="job" disabled={setup.jobs.length === 0}>
                      Basé sur une offre
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {scenarioMode === "job" ? (
                <div className="space-y-2">
                  <Label>Offre</Label>
                  <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      {setup.jobs.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Poste visé</Label>
                  <Input value={customRole} onChange={(e) => setCustomRole(e.target.value)} />
                </div>
              )}
            </div>
            <Button
              type="button"
              className="w-full btn-digi-primary"
              disabled={loading}
              onClick={() => void handleStart()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mic className="h-4 w-4 mr-2" />
              )}
              Démarrer
            </Button>
          </div>
        )}

        {(phase === "live" || phase === "debrief") && (
          <>
            <div
              ref={scrollRef}
              className="h-[min(420px,50vh)] overflow-y-auto p-4 space-y-4 bg-[var(--digi-surface)]/40"
            >
              {messages.map((msg, i) => (
                <div
                  key={`msg-${i}`}
                  className={cn(
                    "flex items-end gap-2",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <AIAvatar />
                  ) : (
                    <UserAvatar
                      avatarUrl={setup.userAvatarUrl}
                      name={setup.userDisplayName}
                    />
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-[#030A8C] text-white rounded-br-sm"
                        : "bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-sm"
                    )}
                  >
                    {msg.role === "assistant" &&
                    isSpeaking &&
                    currentSpeakingId === i ? (
                      <SpeakingText text={msg.content} charIndex={spokenUpTo} />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isSpeaking && currentSpeakingId === null && (
                <div className="flex items-center gap-2 px-1">
                  <AIAvatar />
                  <div className="flex items-end gap-0.5 h-5">
                    {[1, 2, 3, 4, 3].map((h, idx) => (
                      <div
                        key={idx}
                        className="w-1 bg-[#030A8C] rounded-full animate-pulse"
                        style={{
                          height: `${h * 4}px`,
                          animationDelay: `${idx * 0.1}s`,
                          animationDuration: "0.8s",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">Le recruteur parle…</span>
                  <button
                    type="button"
                    onClick={handleSkipSpeech}
                    className="text-xs text-muted-foreground border rounded-full px-3 py-1 hover:bg-gray-50 ml-auto"
                  >
                    Passer
                  </button>
                </div>
              )}

              {loading && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Réflexion…
                </p>
              )}
              {micActive && (
                <p className="text-xs text-[var(--digi-accent)] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Écoute — parlez ou tapez ci-dessous
                </p>
              )}
            </div>

            {phase === "debrief" && debriefText && (
              <div className="mx-4 mb-4 border rounded-xl p-5 bg-gradient-to-br from-[#030A8C]/5 to-[#D10069]/5">
                <h3 className="font-semibold flex items-center gap-2 mb-3 text-[var(--digi-navy)]">
                  <Star size={18} className="text-[#D10069]" aria-hidden />
                  Bilan de l&apos;entretien
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--digi-navy)]">
                  {debriefText}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button type="button" className="btn-digi-primary text-sm" onClick={handleReset}>
                    Recommencer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-sm"
                    onClick={() => router.push("/candidatures")}
                  >
                    Voir mes candidatures →
                  </Button>
                </div>
              </div>
            )}

            {phase === "live" && (
              <div className="border-t pt-4 px-4 pb-4 space-y-3 bg-white">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">
                      {micActive
                        ? "Parlez… ou tapez votre réponse"
                        : "Tapez votre réponse"}
                    </p>
                    {micActive && interimTranscript && (
                      <p className="text-xs text-[var(--digi-accent)] mb-1 italic">
                        {interimTranscript}
                      </p>
                    )}
                    <textarea
                      value={textInput}
                      onChange={(e) => {
                        setTextInput(e.target.value);
                        textInputRef.current = e.target.value;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSendMessage();
                        }
                      }}
                      placeholder="Tapez votre réponse ici… (Entrée pour envoyer)"
                      className="w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#030A8C]/20"
                      rows={2}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        micActive ? stopListening() : void startListening()
                      }
                      className={micActive ? "border-[var(--digi-accent)]" : ""}
                      title="Micro (transcription Whisper)"
                    >
                      {micActive ? (
                        <Mic className="h-4 w-4" />
                      ) : (
                        <MicOff className="h-4 w-4" />
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={() => void handleSendMessage()}
                      disabled={loading || !textInput.trim()}
                      className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#030A8C] to-[#D10069] text-white flex items-center justify-center disabled:opacity-50"
                      aria-label="Envoyer"
                    >
                      <Send size={16} aria-hidden />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>
                    Tour {userTurns}/{INTERVIEW_MAX_TURNS}
                  </span>
                  <div className="flex gap-2">
                    {isSpeaking && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleSkipSpeech}
                      >
                        Passer la voix
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={userTurns < 1 || loading}
                      onClick={() => void handleFinish()}
                    >
                      Terminer
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Card className="border-[var(--digi-border)] bg-white/90 p-4">
        <h3 className="font-display font-semibold text-[var(--digi-navy)] text-sm mb-2">
          Aperçu profil
        </h3>
        {!setup.profile.work_experience?.length &&
        !setup.profile.skills?.length &&
        !setup.profile.education?.length ? (
          <div className="text-center py-3">
            <p className="text-sm text-[var(--digi-muted)] mb-3">
              Profil vide — complétez votre CV pour des questions pertinentes.
            </p>
            <Link
              href="/resumes"
              className="inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#030A8C] to-[#D10069]"
            >
              Compléter mon profil →
            </Link>
          </div>
        ) : (
          <p className="text-xs text-[var(--digi-muted)] whitespace-pre-wrap max-h-40 overflow-y-auto">
            {setup.profileBrief}
          </p>
        )}
      </Card>
    </div>
  );
}
