'use client';

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";

export const CREATION_STEPS = [
  { id: 'analyzing', label: 'Analyzing Job Description' },
  { id: 'formatting', label: 'Formatting Requirements' },
  { id: 'tailoring', label: 'Tailoring Resume Content' },
  { id: 'finalizing', label: 'Finalizing Resume' },
] as const;

export type CreationStep = typeof CREATION_STEPS[number]['id'];

export type LoadingOverlayVariant = 'resume' | 'letter';

const STEP_LABELS: Record<
  LoadingOverlayVariant,
  Record<CreationStep, { en: string; fr: string }>
> = {
  resume: {
    analyzing: { en: 'Analyzing Job Description', fr: "Analyse de l'offre d'emploi" },
    formatting: { en: 'Formatting Requirements', fr: 'Structuration des exigences' },
    tailoring: { en: 'Tailoring Resume Content', fr: 'Adaptation du contenu du CV' },
    finalizing: { en: 'Finalizing Resume', fr: 'Finalisation du CV' },
  },
  letter: {
    analyzing: { en: 'Analyzing Job Description', fr: "Analyse de l'offre d'emploi" },
    formatting: { en: 'Formatting Requirements', fr: "Structuration de l'offre" },
    tailoring: { en: 'Preparing Letter Context', fr: 'Préparation du contexte pour la lettre' },
    finalizing: { en: 'Finalizing Cover Letter', fr: 'Finalisation de la lettre' },
  },
};

const STEP_HINTS: Record<
  LoadingOverlayVariant,
  Record<CreationStep, { en: string; fr: string }>
> = {
  resume: {
    analyzing: {
      en: 'Reading and understanding the job requirements...',
      fr: "Lecture et compréhension des exigences de l'offre…",
    },
    formatting: {
      en: 'Structuring the job information...',
      fr: "Structuration des informations de l'offre…",
    },
    tailoring: {
      en: 'Optimizing your resume for the best match...',
      fr: 'Optimisation de votre CV pour cette offre…',
    },
    finalizing: {
      en: 'Putting the final touches...',
      fr: 'Dernières retouches sur votre CV…',
    },
  },
  letter: {
    analyzing: {
      en: 'Reading and understanding the job requirements...',
      fr: "Lecture et compréhension de l'offre collée…",
    },
    formatting: {
      en: 'Structuring the job information...',
      fr: "Extraction des informations clés de l'offre…",
    },
    tailoring: {
      en: 'Linking your resume to this job for the letter...',
      fr: 'Association de votre CV à cette offre pour la lettre…',
    },
    finalizing: {
      en: 'Opening the cover letter editor...',
      fr: "Ouverture de l'éditeur de lettre de motivation…",
    },
  },
};

const OVERLAY_TITLE: Record<LoadingOverlayVariant, { en: string; fr: string }> = {
  resume: { en: 'Creating Resume', fr: 'Création du CV' },
  letter: { en: 'Creating Cover Letter', fr: 'Création de la lettre' },
};

interface LoadingOverlayProps {
  currentStep: CreationStep;
  variant?: LoadingOverlayVariant;
}

export function LoadingOverlay({ currentStep, variant = 'resume' }: LoadingOverlayProps) {
  const digi = IS_DIGIMYTCH_TALENT_HUB;
  const lang = digi ? 'fr' : 'en';
  const steps = CREATION_STEPS.map((step) => ({
    id: step.id,
    label: STEP_LABELS[variant][step.id][lang],
  }));
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  const title = OVERLAY_TITLE[variant][lang];
  const hint = STEP_HINTS[variant][currentStep][lang];

  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="font-medium text-gray-900">{title}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors duration-300",
                  isActive && "bg-pink-50 text-pink-900",
                  isCompleted && "text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : isActive ? (
                  <div className="h-5 w-5 flex items-center justify-center">
                    <LoadingDots className="text-pink-600" />
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive && "text-pink-900",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground animate-pulse">{hint}</p>
        </div>
      </div>
    </div>
  );
}
