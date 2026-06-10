"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { FileText, Upload, Loader2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResumeScorePanel from "@/components/resume/editor/panels/resume-score-panel";
import { ATSGapAnalyzerLazy } from "@/components/digimytch/digimytch-panels-lazy";
import { resumeToCvContent } from "@/lib/ats-gap-cv";
import type { Job, Resume, ResumeSummary } from "@/lib/types";
import {
  loadImportedCvScoringBundle,
  loadResumeScoringBundle,
} from "@/utils/actions/resumes/score-standalone";
import { useLanguage } from "@/lib/use-language";
import { scoreCvCopy } from "@/lib/score-cv-i18n";
import { EXAMPLE_JOB_POSTING_EN, EXAMPLE_JOB_POSTING_FR } from "@/lib/score-cv-examples";

type CvScoreHubProps = {
  baseResumes: ResumeSummary[];
};

export function CvScoreHub({ baseResumes }: CvScoreHubProps) {
  const { lang } = useLanguage();
  const t = scoreCvCopy(lang);

  const [mode, setMode] = useState<"import" | "existing">(
    baseResumes.length > 0 ? "existing" : "import"
  );
  const [selectedResumeId, setSelectedResumeId] = useState(baseResumes[0]?.id ?? "");
  const [cvText, setCvText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [jobText, setJobText] = useState("");
  const [existingJobText, setExistingJobText] = useState("");
  const [bundle, setBundle] = useState<{
    resume: Resume;
    job: Job | null;
    storageKey: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const runAnalysis = useCallback(() => {
    startTransition(async () => {
      try {
        let next;
        if (mode === "existing") {
          if (!selectedResumeId) {
            toast.error(t.pickResume);
            return;
          }
          next = await loadResumeScoringBundle(selectedResumeId);
        } else {
          next = await loadImportedCvScoringBundle({
            cvText,
            targetRole: targetRole || undefined,
            jobText: jobText || undefined,
          });
        }
        setBundle(next);
        toast.success(t.ready);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t.error);
      }
    });
  }, [mode, selectedResumeId, cvText, targetRole, jobText, t]);

  return (
    <div className="space-y-8">
      <Tabs
        value={mode}
        onValueChange={(v) => {
          setMode(v as "import" | "existing");
          setBundle(null);
        }}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" aria-hidden />
            {t.tabImport}
          </TabsTrigger>
          <TabsTrigger value="existing" className="gap-2" disabled={baseResumes.length === 0}>
            <FileText className="h-4 w-4" aria-hidden />
            {t.tabExisting}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-6 space-y-4">
          <div className="rounded-xl border border-[var(--digi-border)] bg-white p-4 sm:p-6 space-y-4">
            <p className="text-sm text-[var(--digi-muted)]">{t.importHint}</p>
            <div className="space-y-2">
              <Label htmlFor="cv-text">{t.cvLabel}</Label>
              <Textarea
                id="cv-text"
                rows={12}
                className="font-mono text-sm"
                placeholder={t.cvPlaceholder}
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-role">{t.roleLabel}</Label>
              <Input
                id="target-role"
                placeholder={t.rolePlaceholder}
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="job-text">{t.jobLabel}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-[var(--digi-accent)]"
                  onClick={() =>
                    setJobText(lang === "en" ? EXAMPLE_JOB_POSTING_EN : EXAMPLE_JOB_POSTING_FR)
                  }
                >
                  Exemple d&apos;annonce →
                </Button>
              </div>
              <Textarea
                id="job-text"
                rows={5}
                className="font-mono text-sm"
                placeholder={t.jobPlaceholder}
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
              />
              <p className="text-xs text-[var(--digi-muted)]">{t.jobHint}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="existing" className="mt-6 space-y-4">
          <div className="rounded-xl border border-[var(--digi-border)] bg-white p-4 sm:p-6 space-y-4">
            <p className="text-sm text-[var(--digi-muted)]">{t.existingHint}</p>
            <div className="space-y-2">
              <Label>{t.selectCv}</Label>
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {baseResumes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} — {r.target_role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="existing-job-text">{t.existingJobLabel}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-[var(--digi-accent)]"
                  onClick={() =>
                    setExistingJobText(
                      lang === "en" ? EXAMPLE_JOB_POSTING_EN : EXAMPLE_JOB_POSTING_FR
                    )
                  }
                >
                  Exemple d&apos;annonce →
                </Button>
              </div>
              <Textarea
                id="existing-job-text"
                rows={5}
                className="font-mono text-sm"
                placeholder={t.existingJobPlaceholder}
                value={existingJobText}
                onChange={(e) => setExistingJobText(e.target.value)}
              />
              <p className="text-xs text-[var(--digi-muted)]">{t.jobHint}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/resumes">{t.manageCvs}</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className="btn-digi-primary gap-2"
          disabled={pending}
          onClick={runAnalysis}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <BarChart3 className="h-4 w-4" aria-hidden />
          )}
          {pending ? t.analyzing : t.analyzeBtn}
        </Button>
        {bundle && (
          <Button type="button" variant="outline" onClick={() => setBundle(null)}>
            {t.changeSource}
          </Button>
        )}
      </div>

      {bundle && (
        <>
          <section className="rounded-xl border border-[var(--digi-border)] bg-[var(--digi-surface)] p-4 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-[var(--digi-dark)] mb-4">
              {t.resultsTitle}
            </h2>
            <ResumeScorePanel
              resume={bundle.resume}
              job={bundle.job}
              storageKey={bundle.storageKey}
              labels={lang}
              autoGenerate
            />
          </section>

          <section className="rounded-xl border border-[var(--digi-border)] bg-white p-4 sm:p-6">
            <ATSGapAnalyzerLazy
              cvContent={resumeToCvContent(bundle.resume)}
              jobDescription={
                (mode === "import" ? jobText : existingJobText).trim() ||
                bundle.job?.description?.trim() ||
                ""
              }
              lang={lang}
              autoRun
            />
          </section>
        </>
      )}

      {!bundle && (
        <p className="text-sm text-[var(--digi-muted)] text-center py-8 border border-dashed border-[var(--digi-border)] rounded-xl">
          {t.emptyResults}
        </p>
      )}
    </div>
  );
}
