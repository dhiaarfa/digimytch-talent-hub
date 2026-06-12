"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Link2, Target, ClipboardList, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Job, JobMatchResult, Resume } from "@/lib/types";
import { getHybridJobsWithMatchScores } from "@/utils/actions/digimytch/actions";
import { ScoreBridgePanel } from "@/components/jobs/score-bridge-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddJobModal } from "@/components/jobs/add-job-modal";
import { PlatformJobsCatalog } from "@/components/jobs/platform-jobs-catalog";
import { ViewModeToggle, type ViewMode } from "@/components/ui/view-mode-toggle";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/use-language";
import { appCopy } from "@/lib/digi-i18n";
import { cn } from "@/lib/utils";
import { AiPoweredBadge } from "@/components/ui/ai-powered-badge";

export interface JobWithMatch {
  job: Job;
  match: JobMatchResult;
}

interface JobsMatchingHubProps {
  resume: Resume | null;
  jobsWithMatch: JobWithMatch[];
  trackedJobIds: string[];
  availableCatalogSlugs?: string[];
}

export function JobsMatchingHub({ resume, jobsWithMatch, trackedJobIds, availableCatalogSlugs = [] }: JobsMatchingHubProps) {
  const { lang } = useLanguage();
  const t = appCopy(lang);
  const [addJobOpen, setAddJobOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [semanticOn, setSemanticOn] = useState(false);
  const [displayMatches, setDisplayMatches] = useState(jobsWithMatch);
  const [pending, startTransition] = useTransition();
  const count = displayMatches.length;
  const trackedSet = new Set(trackedJobIds);

  useEffect(() => {
    if (!semanticOn) setDisplayMatches(jobsWithMatch);
  }, [jobsWithMatch, semanticOn]);

  const toggleSemantic = useCallback(
    (enabled: boolean) => {
      setSemanticOn(enabled);
      if (!enabled) {
        setDisplayMatches(jobsWithMatch);
        return;
      }
      startTransition(async () => {
        try {
          const hybrid = await getHybridJobsWithMatchScores();
          setDisplayMatches(hybrid.jobsWithMatch);
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : "Recherche sémantique indisponible"
          );
          setSemanticOn(false);
          setDisplayMatches(jobsWithMatch);
        }
      });
    },
    [jobsWithMatch]
  );

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--digi-muted)] hover:text-[var(--digi-navy)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {lang === "en" ? "Dashboard" : "Tableau de bord"}
        </Link>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <AiPoweredBadge />
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--digi-navy)] dark:text-[var(--digi-dark-fg)]">
            {t.jobsTitle}
          </h1>
          <p className="text-sm text-[var(--digi-muted)] mt-2 max-w-xl leading-relaxed">
            {t.jobsDesc}{" "}
            <Link
              href="/candidatures"
              className="text-[var(--digi-accent)] font-medium hover:underline"
            >
              {t.jobsApplications}
            </Link>
            .
          </p>
        </div>

        <ol className="grid gap-2 sm:grid-cols-3 text-sm">
          <li className="flex gap-2 rounded-lg border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] px-3 py-2">
            <span className="font-bold text-[var(--digi-accent)]">1</span>
            <span className="text-[var(--digi-muted)]">{t.jobsStep1}</span>
          </li>
          <li className="flex gap-2 rounded-lg border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] px-3 py-2">
            <span className="font-bold text-[var(--digi-accent)]">2</span>
            <span className="text-[var(--digi-muted)]">{t.jobsStep2}</span>
          </li>
          <li className="flex gap-2 rounded-lg border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] px-3 py-2">
            <span className="font-bold text-[var(--digi-accent)]">3</span>
            <span className="text-[var(--digi-muted)]">{t.jobsStep3}</span>
          </li>
        </ol>

        <Button
          type="button"
          className="btn-digi-primary w-full sm:w-auto"
          onClick={() => setAddJobOpen(true)}
        >
          <Link2 className="h-4 w-4 mr-2" />
          Analyser une offre externe
        </Button>
      </header>

      <AddJobModal open={addJobOpen} onOpenChange={setAddJobOpen} />

      {/* Stats summary bar — shown once we have jobs */}
      {count > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(() => {
            const scores = displayMatches.map((j) => j.match.score ?? 0).filter(Boolean);
            const best = scores.length ? Math.max(...scores) : 0;
            const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            const highMatch = scores.filter((s) => s >= 70).length;
            return [
              { icon: Target, value: count, label: lang === "en" ? "jobs analyzed" : "offres analysees", color: "text-[#D10069]", bg: "bg-[#D10069]/8", iconBg: "bg-[#D10069]/12" },
              { icon: Sparkles, value: `${best}%`, label: lang === "en" ? "best score" : "meilleur score", color: "text-violet-700", bg: "bg-violet-50", iconBg: "bg-violet-100" },
              { icon: ClipboardList, value: highMatch, label: lang === "en" ? "high matches (≥70%)" : "bons matchs (70%+)", color: "text-[#030A8C]", bg: "bg-[#030A8C]/8", iconBg: "bg-[#030A8C]/12" },
            ].map(({ icon: Icon, value, label, color, bg, iconBg }) => (
              <div key={label} className={`rounded-xl border border-[var(--digi-border)] ${bg} p-3 flex items-center gap-3`}>
                <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} aria-hidden />
                </div>
                <div>
                  <p className={`text-xl font-bold ${color} leading-none`}>{value}</p>
                  <p className="text-xs text-[var(--digi-muted)] mt-0.5">{label}</p>
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      <PlatformJobsCatalog availableSlugs={availableCatalogSlugs} />

      <section className="rounded-xl border border-dashed border-[var(--digi-border)] bg-[var(--digi-surface)]/50 px-4 py-3 text-xs text-[var(--digi-muted)]">
        <p>
          <strong className="text-[var(--digi-dark)]">Offre externe</strong> : vous collez une annonce LinkedIn / Rekrute — score personnalisé sur votre CV.
        </p>
        <p className="mt-1">
          <strong className="text-[var(--digi-dark)]">Offre Digimytch</strong>{" "}
          <Sparkles className="inline h-3 w-3 text-[#030A8C]" aria-hidden /> : catalogue pré-rempli — idéal pour tester le matching rapidement.
        </p>
      </section>

      {!resume && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-base">{t.jobsNoResumeTitle}</CardTitle>
            <CardDescription>{t.jobsNoResumeDesc}</CardDescription>
            <Button asChild size="sm" variant="outline" className="w-fit mt-2">
              <Link href="/resumes">{t.jobsGoResume}</Link>
            </Button>
          </CardHeader>
        </Card>
      )}

      {count === 0 ? (
        <EmptyState
          icon={Target}
          title={t.jobsEmptyTitle}
          description={t.jobsEmptyDesc}
          action={{
            label: t.jobsEmptyCta,
            onClick: () => setAddJobOpen(true),
          }}
        />
      ) : (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--digi-dark)] dark:text-[var(--digi-dark-fg)]">
              {t.jobsYourOffers} ({count})
            </h2>
            <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] px-3 py-1.5">
              <Switch
                id="semantic-matching"
                checked={semanticOn}
                disabled={pending || !resume}
                onCheckedChange={toggleSemantic}
              />
              <Label
                htmlFor="semantic-matching"
                className="text-xs font-medium cursor-pointer text-[var(--digi-dark)]"
              >
                {pending ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    {t.jobsSemanticLoading}
                  </span>
                ) : (
                  t.jobsSemanticToggle
                )}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
              <Button asChild variant="ghost" size="sm" className="text-[var(--digi-muted)]">
                <Link href="/candidatures" className="gap-1">
                  <ClipboardList className="h-4 w-4" />
                  {t.jobsApplications}
                </Link>
              </Button>
            </div>
            </div>
          </div>
          <div
            className={cn(
              viewMode === "grid"
                ? "grid gap-4 sm:grid-cols-2"
                : "flex flex-col gap-4"
            )}
          >
            {displayMatches.map(({ job, match }) => (
              <ScoreBridgePanel
                key={job.id}
                job={job}
                match={match}
                hasResume={!!resume}
                alreadyTracked={trackedSet.has(job.id)}
                semanticMode={semanticOn}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
