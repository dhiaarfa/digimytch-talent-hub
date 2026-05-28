"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Sparkles, BookOpen, FileText } from "lucide-react";
import type { Job, JobMatchResult } from "@/lib/types";
import { scoreLabel, scoreTailwindBg } from "@/lib/score-theme";
import { ScoreGauge } from "@/components/jobs/score-gauge";
import { SkillPills } from "@/components/jobs/skill-pills";
import { formatJobDateFr } from "@/lib/job-ui";
import { resolveJobImage } from "@/lib/card-images";
import { EntityCardImage } from "@/components/ui/entity-card-image";
import { JobMatchExplain } from "@/components/digimytch/job-match-explain";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrackApplicationButton } from "@/components/jobs/track-application-button";
import { DeleteJobButton } from "@/components/jobs/delete-job-button";

interface ScoreBridgePanelProps {
  job: Job;
  match: JobMatchResult;
  hasResume?: boolean;
  alreadyTracked?: boolean;
}

export function ScoreBridgePanel({
  job,
  match,
  hasResume = true,
  alreadyTracked = false,
}: ScoreBridgePanelProps) {
  const router = useRouter();
  const label = scoreLabel(match.score);
  const firstGap = match.missingKeywords[0] ?? match.gapSkills[0];
  const title = job.position_title || "Poste sans titre";
  const jobImage = resolveJobImage(job);

  return (
    <article className="group rounded-xl border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] shadow-[var(--digi-card-shadow)] overflow-hidden">
      <EntityCardImage
        src={jobImage.src}
        alt={jobImage.alt}
        variant="job"
        priority
      />
      <header className="flex flex-wrap items-center gap-4 p-5 border-b border-[var(--digi-border)]">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-[var(--digi-muted)] mb-0.5">
            Résultat d&apos;analyse
          </p>
          <h3 className="font-display font-semibold text-lg text-[var(--digi-dark)] leading-tight">
            {title}
          </h3>
          <p className="text-sm text-[var(--digi-muted)]">
            {job.company_name || "Entreprise non précisée"}
            {job.created_at ? ` · ${formatJobDateFr(job.created_at)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ScoreGauge score={match.score} />
          <Badge className={`${scoreTailwindBg(match.score)} text-white border-0`}>{label}</Badge>
        </div>
      </header>
      {!hasResume && (
        <p className="px-5 py-2 text-xs text-amber-800 bg-amber-50 border-b border-amber-100">
          <Link href="/resumes" className="underline font-medium">
            Créez un CV de base
          </Link>{" "}
          pour un score plus précis.
        </p>
      )}
      {hasResume && match.score === 0 && (
        <div className="mx-5 mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            Votre CV est vide ou sans compétences reconnues pour cette offre — complétez-le.{" "}
            <Link href="/resumes" className="underline font-medium">
              Compléter mon CV →
            </Link>
          </p>
        </div>
      )}

      <Tabs defaultValue="skills" className="p-5">
        <TabsList className="grid w-full grid-cols-3 mb-4 relative z-10">
          <TabsTrigger type="button" value="skills" className="gap-1 text-xs sm:text-sm cursor-pointer">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            Compétences
          </TabsTrigger>
          <TabsTrigger type="button" value="ai" className="gap-1 text-xs sm:text-sm cursor-pointer">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Analyse IA
          </TabsTrigger>
          <TabsTrigger type="button" value="courses" className="gap-1 text-xs sm:text-sm cursor-pointer">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Formations
          </TabsTrigger>
        </TabsList>
        <TabsContent value="skills">
          <SkillPills
            matched={[...new Set([...match.matchedKeywords, ...match.matchedSkills])].slice(0, 24)}
            missing={[...new Set([...match.missingKeywords, ...match.gapSkills])].slice(0, 24)}
          />
        </TabsContent>
        <TabsContent value="ai" className="min-h-[140px]">
          <JobMatchExplain
            jobId={job.id}
            jobTitle={job.position_title}
            matchScore={match.score}
          />
        </TabsContent>
        <TabsContent value="courses">
          {match.gapSkills.length === 0 && match.missingKeywords.length === 0 ? (
            <p className="text-sm text-[var(--digi-muted)]">
              Aucun écart majeur détecté pour cette offre.
            </p>
          ) : (
            <ul className="text-sm space-y-2 text-[var(--digi-muted)]">
              {[...new Set([...match.gapSkills, ...match.missingKeywords])].slice(0, 8).map((s) => (
                <li key={s}>
                  <Link href="/formations" className="text-[var(--digi-accent)] hover:underline">
                    Formations pour {s} →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      {firstGap && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-[var(--digi-surface)] border-t border-[var(--digi-border)]">
          <span className="text-sm text-[var(--digi-dark)]">
            Écart : <strong>{firstGap}</strong>
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => router.push("/formations")}
          >
            Voir les formations →
          </Button>
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-t border-[var(--digi-border)] bg-white">
        <TrackApplicationButton jobId={job.id} alreadyTracked={alreadyTracked} />
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" size="sm" variant="outline">
            <Link href="/resumes">
              <FileText className="h-3.5 w-3.5 mr-1" />
              Adapter mon CV
            </Link>
          </Button>
          <DeleteJobButton jobId={job.id} jobTitle={title} />
        </div>
      </footer>
    </article>
  );
}
