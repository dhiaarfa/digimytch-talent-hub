"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Loader2, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreGauge } from "@/components/jobs/score-gauge";
import { scoreTailwindBg } from "@/lib/score-theme";
import type { AtsGapAnalysis } from "@/lib/ats-gap-schema";
import type { AtsCvContent } from "@/lib/ats-gap-cv";
import { ATS_GAP_MODEL } from "@/lib/ats-gap-constants";
import { friendlyAIErrorMessage } from "@/lib/ai/friendly-error";
import { cn, withBasePath } from "@/lib/utils";
import { useApiKeys } from "@/hooks/use-api-keys";
import { scoreCvCopy } from "@/lib/score-cv-i18n";
import type { DigiLang } from "@/lib/use-language";

type ATSGapAnalyzerProps = {
  cvContent: AtsCvContent;
  jobDescription: string;
  lang?: DigiLang;
  autoRun?: boolean;
};

function SectionBlock({
  title,
  score,
  present,
  missing,
  showPresent = true,
}: {
  title: string;
  score: number;
  present?: string[];
  missing: string[];
  showPresent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--digi-border)] bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-[var(--digi-dark)]">{title}</h4>
        <span className="text-xs font-medium text-[var(--digi-muted)]">{score}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[var(--digi-border)] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", scoreTailwindBg(score))}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      {showPresent && (present?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {present!.map((kw) => (
            <Badge
              key={`p-${title}-${kw}`}
              variant="outline"
              className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200"
            >
              {kw}
            </Badge>
          ))}
        </div>
      )}
      {missing.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {missing.map((kw) => (
            <Badge
              key={`m-${title}-${kw}`}
              variant="outline"
              className="text-xs bg-red-50 text-red-700 border-red-200"
            >
              {kw}
            </Badge>
          ))}
        </div>
      )}
      {missing.length === 0 && (!showPresent || (present?.length ?? 0) === 0) && (
        <p className="text-xs text-[var(--digi-muted)]">Aucun écart détecté sur cette section.</p>
      )}
    </div>
  );
}

function AtsGapSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Analyse ATS en cours">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Skeleton className="h-[88px] w-[88px] rounded-full" />
        <div className="flex-1 space-y-2 w-full">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

export function ATSGapAnalyzer({
  cvContent,
  jobDescription,
  lang = "fr",
  autoRun = true,
}: ATSGapAnalyzerProps) {
  const t = scoreCvCopy(lang);
  const { apiKeys } = useApiKeys();
  const [data, setData] = useState<AtsGapAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRunKey = useRef("");

  const runAnalysis = useCallback(async () => {
    const trimmedJob = jobDescription.trim();
    if (trimmedJob.length < 40) {
      toast.error(t.atsJobTooShort);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(withBasePath("/api/cv/ats-gap"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv_content: cvContent,
          job_description: trimmedJob,
          model: ATS_GAP_MODEL,
          apiKeys,
        }),
      });

      const payload = (await response.json()) as AtsGapAnalysis & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? t.atsError);
      }

      setData(payload);
      toast.success(t.atsReady);
    } catch (e) {
      const msg = e instanceof Error ? friendlyAIErrorMessage(e) : t.atsError;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [apiKeys, cvContent, jobDescription, t]);

  useEffect(() => {
    if (!autoRun) return;
    const key = JSON.stringify({ cvContent, job: jobDescription.trim() });
    if (key === lastRunKey.current) return;
    if (jobDescription.trim().length < 40) return;
    lastRunKey.current = key;
    void runAnalysis();
  }, [autoRun, cvContent, jobDescription, runAnalysis]);

  async function copyCriticalMissing() {
    if (!data?.critical_missing.length) {
      toast.message(t.atsNothingToCopy);
      return;
    }
    try {
      await navigator.clipboard.writeText(data.critical_missing.join(", "));
      toast.success(t.atsCopied);
    } catch {
      toast.error(t.atsCopyFailed);
    }
  }

  if (jobDescription.trim().length < 40) {
    return (
      <p className="text-sm text-[var(--digi-muted)] border border-dashed border-[var(--digi-border)] rounded-xl p-4 text-center">
        {t.atsNeedJob}
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-[var(--digi-dark)] flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--digi-accent)]" aria-hidden />
            {t.atsTitle}
          </h3>
          <p className="text-sm text-[var(--digi-muted)] mt-1 max-w-xl">{t.atsSubtitle}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => void runAnalysis()}
          className="shrink-0 gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden />
          )}
          {loading ? t.atsAnalyzing : t.atsRerun}
        </Button>
      </div>

      {loading && !data && <AtsGapSkeleton />}

      {error && !loading && !data && (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg p-4">{error}</p>
      )}

      {data && (
        <div className={cn(loading && "opacity-60 pointer-events-none")}>
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            <ScoreGauge score={data.overall_ats_score} />
            <div className="text-center sm:text-left space-y-1">
              <p className="text-sm font-medium text-[var(--digi-dark)]">{t.atsOverall}</p>
              <p className="text-xs text-[var(--digi-muted)]">{t.atsOverallHint}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 mb-6">
            <SectionBlock
              title={t.atsSectionSummary}
              score={data.sections.summary.score}
              present={data.sections.summary.present}
              missing={data.sections.summary.missing}
            />
            <SectionBlock
              title={t.atsSectionExperience}
              score={data.sections.experience.score}
              present={data.sections.experience.present}
              missing={data.sections.experience.missing}
            />
            <SectionBlock
              title={t.atsSectionSkills}
              score={data.sections.skills.score}
              present={data.sections.skills.present}
              missing={data.sections.skills.missing}
            />
            <SectionBlock
              title={t.atsSectionEducation}
              score={data.sections.education.score}
              missing={data.sections.education.missing}
              showPresent={false}
            />
          </div>

          {data.quick_wins.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 mb-4 space-y-2">
              <p className="text-sm font-semibold text-amber-900">{t.atsQuickWinsTitle}</p>
              <p className="text-xs text-amber-800">{t.atsQuickWinsHint}</p>
              <div className="flex flex-wrap gap-2">
                {data.quick_wins.slice(0, 3).map((kw) => (
                  <Badge
                    key={kw}
                    className="bg-amber-200 text-amber-950 hover:bg-amber-200 border-amber-400"
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.critical_missing.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-[var(--digi-border)] bg-[var(--digi-surface)] p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--digi-dark)]">{t.atsCriticalTitle}</p>
                <p className="text-xs text-[var(--digi-muted)] mt-1 truncate">
                  {data.critical_missing.join(" · ")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => void copyCriticalMissing()}
              >
                <Copy className="h-4 w-4" aria-hidden />
                {t.atsCopyBtn}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
