"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Target, ClipboardList } from "lucide-react";
import type { Job, JobMatchResult, Resume } from "@/lib/types";
import { ScoreBridgePanel } from "@/components/jobs/score-bridge-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddJobModal } from "@/components/jobs/add-job-modal";
import { ViewModeToggle, type ViewMode } from "@/components/ui/view-mode-toggle";
import { useLanguage } from "@/lib/use-language";
import { appCopy } from "@/lib/digi-i18n";
import { cn } from "@/lib/utils";

export interface JobWithMatch {
  job: Job;
  match: JobMatchResult;
}

interface JobsMatchingHubProps {
  resume: Resume | null;
  jobsWithMatch: JobWithMatch[];
  trackedJobIds: string[];
}

export function JobsMatchingHub({ resume, jobsWithMatch, trackedJobIds }: JobsMatchingHubProps) {
  const { lang } = useLanguage();
  const t = appCopy(lang);
  const [addJobOpen, setAddJobOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const count = jobsWithMatch.length;
  const trackedSet = new Set(trackedJobIds);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div>
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
          <Plus className="h-4 w-4 mr-2" />
          {t.jobsAnalyze}
        </Button>
      </header>

      <AddJobModal open={addJobOpen} onOpenChange={setAddJobOpen} />

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
          <div
            className={cn(
              viewMode === "grid"
                ? "grid gap-4 sm:grid-cols-2"
                : "flex flex-col gap-4"
            )}
          >
            {jobsWithMatch.map(({ job, match }) => (
              <ScoreBridgePanel
                key={job.id}
                job={job}
                match={match}
                hasResume={!!resume}
                alreadyTracked={trackedSet.has(job.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
