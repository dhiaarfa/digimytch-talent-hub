import Link from "next/link";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { Target, BookOpen, ClipboardList, Mic, ArrowRight, BarChart3 } from "lucide-react";

const MODULES = [
  {
    href: "/score-cv",
    icon: BarChart3,
    gradient: "from-[#7c3aed] to-[#D10069]",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    iconColor: "text-violet-700 dark:text-violet-300",
    title: "Score CV",
    desc: "Importez ou collez un CV externe et obtenez une analyse détaillée — sans ouvrir l'éditeur.",
    badge: "IA",
    badgeColor: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  },
  {
    href: "/jobs",
    icon: Target,
    gradient: "from-[#D10069] to-[#ff4d9d]",
    bg: "bg-[#D10069]/8 dark:bg-[#D10069]/15",
    iconColor: "text-[#D10069]",
    title: "Analyser une offre",
    desc: "Collez une annonce LinkedIn ou Rekrute — obtenez votre score de compatibilité en secondes.",
    badge: "Score 0–100",
    badgeColor: "bg-[#D10069]/10 text-[#D10069]",
  },
  {
    href: "/formations",
    icon: BookOpen,
    gradient: "from-[#030A8C] to-[#2940e8]",
    bg: "bg-[#030A8C]/8 dark:bg-[#030A8C]/15",
    iconColor: "text-[#030A8C] dark:text-[#8fa0ff]",
    title: "Formations recommandées",
    desc: "Formations classées selon vos écarts de compétences détectés lors du matching.",
    badge: "Personnalisé",
    badgeColor: "bg-[#030A8C]/10 text-[#030A8C] dark:bg-[#030A8C]/20 dark:text-[#8fa0ff]",
  },
  {
    href: "/candidatures",
    icon: ClipboardList,
    gradient: "from-[#F5A623] to-[#ffc86e]",
    bg: "bg-[#F5A623]/8 dark:bg-[#F5A623]/15",
    iconColor: "text-[#c57d00]",
    title: "Mes candidatures",
    desc: "Tableau Kanban pour suivre chaque démarche : enregistrée → envoyée → entretien → offre.",
    badge: "Kanban",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  {
    href: "/entretiens",
    icon: Mic,
    gradient: "from-[#10b981] to-[#34d399]",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    iconColor: "text-emerald-600",
    title: "Simulateur d'entretien",
    desc: "Recruteur IA vocal. Répondez par texte ou au micro, puis recevez un débrief personnalisé.",
    badge: "Vocal",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
] as const;

export function TalentHubHomeCards() {
  if (!IS_DIGIMYTCH_TALENT_HUB) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6" data-tour="home-modules">
      {MODULES.map((m, i) => (
        <Link
          key={m.href}
          href={m.href}
          className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--digi-accent)] rounded-2xl"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <article className={`h-full rounded-2xl border border-[var(--digi-border)] ${m.bg} p-5 transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-0.5 group-hover:border-[var(--digi-border)] relative overflow-hidden`}>
            {/* Gradient top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${m.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} aria-hidden />

            <div className="flex items-start justify-between gap-3 mb-3">
              <div className={`p-2.5 rounded-xl bg-white/70 dark:bg-black/20 shadow-sm`}>
                <m.icon className={`h-5 w-5 ${m.iconColor}`} aria-hidden />
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.badgeColor}`}>
                {m.badge}
              </span>
            </div>

            <h3 className="font-display font-semibold text-[var(--digi-dark)] dark:text-[var(--digi-dark-fg)] leading-snug mb-1">
              {m.title}
            </h3>
            <p className="text-sm text-[var(--digi-muted)] leading-relaxed line-clamp-2">
              {m.desc}
            </p>

            <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${m.iconColor} opacity-0 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-0.5`}>
              Accéder
              <ArrowRight className="h-3 w-3" aria-hidden />
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}
