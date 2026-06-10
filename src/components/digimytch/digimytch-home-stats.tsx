import Link from "next/link";
import {
  FileText,
  Target,
  BarChart2,
  ClipboardList,
  BookOpen,
  Send,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { getCachedQuickStats } from "@/lib/digimytch-queries";
import { Button } from "@/components/ui/button";
import { DigimytchGuidedTour } from "@/components/digimytch/digimytch-guided-tour";

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({
  href,
  icon: Icon,
  label,
  value,
  sub,
  urgent,
  colorClass,
}: {
  href: string;
  icon: typeof FileText;
  label: string;
  value: string;
  sub: string;
  urgent?: boolean;
  colorClass: string;
}) {
  return (
    <Link href={href} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--digi-accent)] rounded-2xl">
      <div
        className={`h-full rounded-2xl border ${urgent ? "border-[var(--digi-accent)] shadow-md" : "border-[var(--digi-border)]"} bg-[var(--digi-card)] dark:bg-[var(--digi-card)] p-4 transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5 relative overflow-hidden`}
      >
        {urgent && (
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--digi-accent)] animate-pulse-ring" aria-hidden />
        )}
        <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3 ${colorClass}`}>
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </div>
        <p className="text-xs text-[var(--digi-muted)] font-medium mb-1">{label}</p>
        <p className="font-display font-bold text-2xl text-[var(--digi-dark)] dark:text-[var(--digi-dark-fg)] leading-none mb-1">
          {value}
        </p>
        <p className="text-xs text-[var(--digi-muted)] leading-snug">{sub}</p>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export async function DigimytchHomeStats() {
  let jobsCount = 0;
  let avgScore: number | null = null;
  let hasResume = false;
  let activeApplications = 0;
  let gapSkillsCount = 0;

  try {
    const stats = await getCachedQuickStats();
    if (stats) {
      hasResume = stats.hasResume;
      jobsCount = stats.jobsCount;
      avgScore = stats.avgScore;
      activeApplications = stats.activeApplications;
      gapSkillsCount = stats.gapSkillsCount;
    }
  } catch {
    /* dashboard still renders without stats */
  }

  // Next action CTA
  const nextAction = !hasResume
    ? { icon: FileText, title: "Créez votre premier CV", desc: "L'assistant IA vous guidera section par section.", cta: "Commencer", link: "/resumes" }
    : avgScore !== null && avgScore < 65
      ? { icon: BarChart2, title: "Améliorez votre score CV", desc: `Score moyen ${avgScore}/100 — analysez et optimisez votre CV pour mieux matcher vos offres.`, cta: "Analyser mon CV", link: "/score-cv" }
    : jobsCount === 0
      ? { icon: Target, title: "Analysez votre première offre", desc: "Collez une offre LinkedIn ou Rekrute pour obtenir votre score.", cta: "Analyser une offre", link: "/jobs" }
      : activeApplications === 0
        ? { icon: Send, title: "Suivez vos candidatures", desc: "Ajoutez une offre analysée à Mes candidatures.", cta: "Voir mes offres", link: "/jobs" }
        : { icon: BookOpen, title: "Formations recommandées", desc: `${gapSkillsCount} compétences à renforcer selon vos offres.`, cta: "Voir les formations", link: "/formations" };

  const NextIcon = nextAction.icon;

  return (
    <div className="space-y-4 mb-6 animate-fade-in-up">
      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-tour="home-kpis">
        <KPICard
          href="/resumes"
          icon={FileText}
          label="CV principal"
          value={hasResume ? "Actif" : "À créer"}
          sub={hasResume ? "Prêt pour le matching" : "Commencez ici"}
          urgent={!hasResume}
          colorClass="bg-[#030A8C]/10 text-[#030A8C] dark:bg-[#030A8C]/20 dark:text-[#8fa0ff]"
        />
        <KPICard
          href="/jobs"
          icon={Target}
          label="Offres analysées"
          value={String(jobsCount)}
          sub="annonces scorées"
          colorClass="bg-[#D10069]/10 text-[#D10069]"
        />
        <KPICard
          href="/jobs"
          icon={BarChart2}
          label="Score moyen"
          value={avgScore !== null ? `${avgScore}` : "—"}
          sub={avgScore !== null ? `sur 100 · ${avgScore >= 65 ? "Excellent" : avgScore >= 40 ? "Moyen" : "Faible"}` : "Aucune offre encore"}
          colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/20"
        />
        <KPICard
          href="/candidatures"
          icon={ClipboardList}
          label="Candidatures actives"
          value={String(activeApplications)}
          sub="en cours de suivi"
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
        />
      </div>

      {/* Next action hero */}
      <div
        data-tour="home-next-step"
        className="w-full rounded-2xl border-2 border-[var(--digi-accent)]/30 bg-gradient-to-br from-[var(--digi-navy)]/8 via-white to-[var(--digi-accent)]/8 dark:from-[var(--digi-navy)]/15 dark:via-[var(--digi-card)] dark:to-[var(--digi-accent)]/10 p-6 sm:p-8 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex gap-4 flex-1 min-w-0">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--digi-accent)]/20 to-[var(--digi-navy)]/10 flex items-center justify-center">
              <NextIcon className="h-7 w-7 text-[var(--digi-accent)]" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--digi-muted)] mb-1 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                Prochaine étape
              </p>
              <p className="font-display font-bold text-xl sm:text-2xl text-[var(--digi-dark)] dark:text-[var(--digi-dark-fg)] leading-tight">
                {nextAction.title}
              </p>
              <p className="text-sm sm:text-base text-[var(--digi-muted)] mt-2 max-w-2xl leading-relaxed">
                {nextAction.desc}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button asChild size="lg" className="btn-digi-primary gap-2 text-base px-6 h-12">
              <Link href={nextAction.link}>
                {nextAction.cta}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <DigimytchGuidedTour />
          </div>
        </div>
      </div>
    </div>
  );
}
