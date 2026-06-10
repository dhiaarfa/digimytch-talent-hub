"use client";

import { useCallback, useState } from "react";
import {
  MessageSquare,
  Mic,
  Loader2,
  RotateCcw,
  Volume2,
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
import Link from "next/link";
import { ClientOnly } from "@/components/ui/client-only";
import { toast } from "@/hooks/use-toast";
import { useApiKeys, useDefaultModel } from "@/hooks/use-api-keys";
import { useLanguage } from "@/lib/use-language";
import { requestMicrophoneAccess } from "@/lib/speech-tts";
import { getInterviewSttFallbackMessage } from "@/lib/browser-speech";
import type { InterviewScenario } from "@/lib/interview-simulator";
import type { InterviewSetupData } from "@/utils/actions/digimytch/interview-simulator";
import { InterviewEngine } from "@/components/interview/InterviewEngine";

export function InterviewSimulatorPanel({ setup }: { setup: InterviewSetupData }) {
  const { apiKeys } = useApiKeys();
  const { defaultModel } = useDefaultModel();
  const { lang, isEn } = useLanguage();

  const [uiPhase, setUiPhase] = useState<"setup" | "live">("setup");
  const [demoMode, setDemoMode] = useState(setup.isProfileEmpty);
  const [scenarioMode, setScenarioMode] = useState<"profile" | "job">("profile");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [customRole, setCustomRole] = useState(setup.defaultTargetRole);
  const [activeScenario, setActiveScenario] = useState<InterviewScenario | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const [micChecking, setMicChecking] = useState(false);
  const [showMicInstructions, setShowMicInstructions] = useState(
    () => typeof window !== "undefined" && !localStorage.getItem("mic-instructions-seen")
  );
  const [browserSttHint] = useState(() =>
    typeof window !== "undefined" ? getInterviewSttFallbackMessage(isEn) : ""
  );

  const aiConfig = { model: defaultModel, apiKeys };

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

  const handleStart = (useDemo = false) => {
    const scenario = buildScenario();
    if (!scenario.targetRole.trim()) {
      toast({
        title: "Poste requis",
        description: "Indiquez le poste visé.",
        variant: "destructive",
      });
      return;
    }
    setDemoMode(useDemo || setup.isProfileEmpty);
    setActiveScenario(scenario);
    setUiPhase("live");
  };

  const handleReset = () => {
    setUiPhase("setup");
    setActiveScenario(null);
    setDemoMode(setup.isProfileEmpty);
  };

  return (
    <div className="space-y-4">
      <Card className="border-[var(--digi-border)] bg-white/90 overflow-hidden">
        <div className="border-b px-4 py-3 flex flex-wrap justify-between gap-2 bg-gradient-to-r from-[var(--color-primary-blue)]/5 to-[var(--color-accent-magenta)]/5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[var(--digi-accent)]" />
            <div>
              <p className="font-semibold text-[var(--digi-navy)]">Simulateur d&apos;entretien</p>
              <p className="text-xs text-[var(--digi-muted)]">
                Voix Chrome/Edge + synthèse navigateur — texte toujours disponible
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={voiceEnabled ? "default" : "outline"}
              className={voiceEnabled ? "bg-[var(--digi-accent)]" : ""}
              onClick={() => setVoiceEnabled((v) => !v)}
            >
              <Volume2 className="h-4 w-4 mr-1" />
              {voiceEnabled ? "Voix : activée" : "Voix : désactivée"}
            </Button>
            {uiPhase === "live" && (
              <Button type="button" size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Recommencer
              </Button>
            )}
          </div>
        </div>

        {uiPhase === "setup" && (
          <div className="p-4 space-y-4">
            {showMicInstructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-sm text-blue-800 mb-2">Avant de démarrer</h4>
                <ul className="text-xs text-blue-700 space-y-1 list-none">
                  <li>• Chrome / Edge : micro gratuit (Web Speech API)</li>
                  <li>• Firefox / Safari : répondez par le champ texte</li>
                  <li>• Connexion internet requise pour la reconnaissance vocale</li>
                  <li>• Pause de 2 s = envoi automatique en mode vocal</li>
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                className="flex-1 btn-digi-primary"
                onClick={() => handleStart(false)}
              >
                <Mic className="h-4 w-4 mr-2" />
                Démarrer
              </Button>
              {setup.isProfileEmpty && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-[var(--digi-accent)] text-[var(--digi-navy)]"
                  onClick={() => handleStart(true)}
                >
                  Démo rapide
                </Button>
              )}
            </div>
          </div>
        )}

        {uiPhase === "live" && activeScenario && (
          <InterviewEngine
            key={activeScenario.targetRole + (activeScenario.jobId ?? "")}
            scenario={activeScenario}
            aiConfig={aiConfig}
            voiceEnabled={voiceEnabled}
            lang={lang}
            userDisplayName={setup.userDisplayName}
            userAvatarUrl={setup.userAvatarUrl}
            demoMode={demoMode}
            onReset={handleReset}
          />
        )}
      </Card>

      <Card className="border-[var(--digi-border)] bg-white/90 p-4">
        <h3 className="font-display font-semibold text-[var(--digi-navy)] text-sm mb-2">
          Aperçu profil
        </h3>
        {setup.isProfileEmpty ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--digi-accent)]">
              Mode démo — profil fictif Alex Martin
            </p>
            <p className="text-xs text-[var(--digi-muted)] whitespace-pre-wrap max-h-40 overflow-y-auto">
              {setup.profileBrief}
            </p>
            <p className="text-xs text-[var(--digi-muted)]">
              Complétez votre profil pour des questions personnalisées, ou lancez la démo rapide.
            </p>
            <Link
              href="/profile"
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
