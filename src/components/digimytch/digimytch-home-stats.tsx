import Link from "next/link";
import {
  FileText,
  Target,
  BarChart2,
  ClipboardList,
  BookOpen,
  Send,
  ArrowRight,
} from "lucide-react";
import { getCachedApplications, getCachedJobsWithMatch } from "@/lib/digimytch-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function KPICard({
  href,
  icon: Icon,
  label,
  value,
  sub,
  urgent,
  accent,
}: {
  href: string;
  icon: typeof FileText;
  label: string;
  value: string;
  sub: string;
  urgent?: boolean;
  accent?: "navy" | "accent" | "orange" | "green";
}) {
  const colors = {
    navy: "text-[var(--digi-navy)] bg-[var(--digi-navy)]/10",
    accent: "text-[var(--digi-accent)] bg-[var(--digi-accent)]/10",
    orange: "text-[var(--digi-orange)] bg-[var(--digi-orange)]/10",
    green: "text-[var(--digi-green)] bg-[var(--digi-green)]/10",
  };
  const c = colors[accent ?? "navy"];

  return (
    <Link href={href} className="block group">
      <Card
        className={`h-full transition-shadow hover:shadow-md border-[var(--digi-border)] ${urgent ? "ring-2 ring-[var(--digi-accent)]" : ""}`}
      >
        <CardContent className="p-4">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${c}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-xs text-[var(--digi-muted)]">{label}</p>
          <p className="font-display font-bold text-xl text-[var(--digi-dark)] mt-0.5">{value}</p>
          <p className="text-xs text-[var(--digi-muted)] mt-1">{sub}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export async function DigimytchHomeStats() {
  let jobsCount = 0;
  let avgScore: number | null = null;
  let hasResume = false;
  let activeApplications = 0;
  let gapSkillsCount = 0;

  try {
    const [{ resume, jobsWithMatch }, apps] = await Promise.all([
      getCachedJobsWithMatch(),
      getCachedApplications(),
    ]);
    hasResume = Boolean(resume);
    jobsCount = jobsWithMatch.length;
    if (jobsWithMatch.length > 0) {
      const sum = jobsWithMatch.reduce((a, j) => a + j.match.score, 0);
      avgScore = Math.round(sum / jobsWithMatch.length);
    }
    const gaps = new Set<string>();
    for (const { match } of jobsWithMatch) {
      match.gapSkills.forEach((g) => gaps.add(g));
      match.missingKeywords.forEach((g) => gaps.add(g));
    }
    gapSkillsCount = gaps.size;
    activeApplications = apps.filter((a) => a.status !== "rejected" && a.status !== "accepted").length;
  } catch {
    /* dashboard still renders */
  }

  const nextAction = !hasResume
    ? {
        icon: FileText,
        title: "Créez votre premier CV",
        desc: "L'assistant IA vous guidera section par section.",
        cta: "Commencer",
        link: "/resumes",
      }
    : jobsCount === 0
      ? {
          icon: Target,
          title: "Analysez votre première offre",
          desc: "Collez une offre d'emploi et découvrez votre score.",
          cta: "Analyser une offre",
          link: "/jobs",
        }
      : activeApplications === 0
        ? {
            icon: Send,
            title: "Suivez vos candidatures",
            desc: "Ajoutez une offre analysée à Mes candidatures, puis faites avancer le statut.",
            cta: "Voir mes offres analysées",
            link: "/jobs",
          }
        : {
            icon: BookOpen,
            title: "Découvrez vos formations recommandées",
            desc: `${gapSkillsCount} compétences à combler selon vos offres.`,
            cta: "Voir les formations",
            link: "/formations",
          };

  const NextIcon = nextAction.icon;

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          href="/resumes"
          icon={FileText}
          label="CV principal"
          value={hasResume ? "Complété" : "À créer"}
          sub={hasResume ? "CV de base actif" : "Commencer maintenant"}
          urgent={!hasResume}
          accent="navy"
        />
        <KPICard
          href="/jobs"
          icon={Target}
          label="Offres analysées"
          value={String(jobsCount)}
          sub="annonces collées et scorées"
          accent="accent"
        />
        <KPICard
          href="/jobs"
          icon={BarChart2}
          label="Score moyen"
          value={avgScore !== null ? `${avgScore}/100` : "—"}
          sub="sur vos offres analysées"
          accent="orange"
        />
        <KPICard
          href="/candidatures"
          icon={ClipboardList}
          label="Candidatures actives"
          value={String(activeApplications)}
          sub="en cours de suivi"
          accent="green"
        />
      </div>

      <div className="rounded-xl border border-[var(--digi-border)] border-l-4 border-l-[var(--digi-accent)] bg-[var(--digi-navy)]/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in-up">
        <div className="flex gap-3 flex-1">
          <NextIcon className="h-8 w-8 text-[var(--digi-accent)] shrink-0" aria-hidden />
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--digi-muted)]">À faire maintenant</p>
            <h3 className="font-display font-semibold text-[var(--digi-dark)]">{nextAction.title}</h3>
            <p className="text-sm text-[var(--digi-muted)] mt-1">{nextAction.desc}</p>
          </div>
        </div>
        <Button asChild className="btn-digi-primary shrink-0">
          <Link href={nextAction.link} className="gap-2">
            {nextAction.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
