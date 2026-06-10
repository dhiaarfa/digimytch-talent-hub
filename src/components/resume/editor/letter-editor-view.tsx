"use client";

import { ArrowLeft, FileText } from "lucide-react";
import { GuardedLink } from "@/contexts/unsaved-navigation-guard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion } from "@/components/ui/accordion";
import type { Job, Resume } from "@/lib/types";
import { TailoredJobAccordion } from "@/components/resume/management/cards/tailored-job-card";
import { CoverLetterPanel } from "@/components/resume/editor/panels/cover-letter-panel";
import { LetterLivePreview } from "@/components/resume/editor/panels/letter-live-preview";
import ChatBot from "@/components/resume/assistant/chatbot";
import { CoverLetterDocumentSettingsPanel } from "@/components/cover-letter/cover-letter-document-settings";
import { useResumeContext } from "@/components/resume/editor/resume-editor-context";
import {
  getCoverLetterSettings,
  mergeCoverLetterPayload,
} from "@/lib/cover-letter-settings";
import { cn } from "@/lib/utils";

interface LetterEditorViewProps {
  resume: Resume;
  job: Job | null;
  isLoadingJob: boolean;
  containerWidth: number;
  onResumeChange: <K extends keyof Resume>(field: K, value: Resume[K]) => void;
}

export function LetterEditorView({
  resume,
  job,
  isLoadingJob,
  containerWidth,
  onResumeChange,
}: LetterEditorViewProps) {
  const { state } = useResumeContext();
  const letterSettings = getCoverLetterSettings(
    state.resume.cover_letter as Record<string, unknown> | undefined
  );

  const updateLetterSettings = (settings: ReturnType<typeof getCoverLetterSettings>) => {
    onResumeChange(
      "cover_letter",
      mergeCoverLetterPayload(state.resume.cover_letter as Record<string, unknown>, {
        settings,
      }) as Resume["cover_letter"]
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] min-h-[32rem] gap-0 lg:gap-4 p-2 sm:p-4 bg-[var(--digi-surface)]">
      {/* Panneau gauche — édition + assistant IA (comme le CV) */}
      <div className="lg:w-[min(520px,48%)] flex flex-col min-h-0 border border-amber-200/70 rounded-xl bg-gradient-to-b from-amber-50/50 to-white shadow-sm relative">
        <div className="shrink-0 px-3 py-2 border-b border-amber-200/80 flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="gap-1 h-8">
            <GuardedLink href="/resumes" className="inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Mes CV & lettres
            </GuardedLink>
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-1 h-8 ml-auto">
            <GuardedLink href={`/resumes/${resume.id}`} className="inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Éditer le CV
            </GuardedLink>
          </Button>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-3 py-3 space-y-4 pb-4">
            <div>
              <h1 className="text-lg font-semibold text-[var(--digi-navy)]">
                Lettre de motivation
              </h1>
              <p className="text-xs text-[var(--digi-muted)] mt-0.5">
                {resume.name} — liée à l&apos;offre ci-dessous
              </p>
            </div>
            <Accordion type="single" collapsible defaultValue="job">
              <TailoredJobAccordion resume={resume} job={job} isLoading={isLoadingJob} />
            </Accordion>
            <CoverLetterPanel resume={resume} job={job} letterMode />
          </div>
        </ScrollArea>

        <div
          className={cn(
            "shrink-0 border-t border-amber-200/80 p-2 bg-amber-50/40",
            "max-h-[min(52vh,520px)]"
          )}
        >
          <ChatBot
            variant="letter"
            resume={state.resume}
            job={job}
            onResumeChange={onResumeChange}
          />
        </div>
      </div>

      {/* Aperçu — mise en page type CV */}
      <div className="flex-1 min-h-[320px] lg:min-h-0 flex flex-col rounded-xl border border-[var(--digi-border)] bg-white overflow-hidden shadow-sm">
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--digi-border)] bg-[var(--digi-surface)]">
          <div>
            <p className="text-sm font-semibold text-[var(--digi-navy)]">Aperçu lettre</p>
            <p className="text-xs text-[var(--digi-muted)]">Format A4 — ajustez la mise en page</p>
          </div>
          <CoverLetterDocumentSettingsPanel
            settings={letterSettings}
            onChange={updateLetterSettings}
          />
        </div>
        <ScrollArea className="flex-1 bg-slate-100/50">
          <div className="p-4 sm:p-6 flex justify-center min-h-full">
            <LetterLivePreview
              containerWidth={containerWidth}
              settings={letterSettings}
              readOnly
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
