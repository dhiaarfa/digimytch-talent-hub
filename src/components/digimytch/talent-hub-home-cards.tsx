import Link from "next/link";
import { isDigimytchTalentHub } from "@/lib/digimytch-config";
import { Target, BookOpen, ClipboardList, Mic } from "lucide-react";

const MODULES = [
  {
    href: "/jobs",
    icon: Target,
    color: "#D10069",
    title: "Analyser une offre",
    desc: "Collez une annonce et obtenez votre score de compatibilité",
    cta: "Analyser une offre →",
  },
  {
    href: "/formations",
    icon: BookOpen,
    color: "#030A8C",
    title: "Formations",
    desc: "Formations recommandées selon vos écarts de compétences",
    cta: "Voir les formations →",
  },
  {
    href: "/candidatures",
    icon: ClipboardList,
    color: "#F5A623",
    title: "Mes candidatures",
    desc: "Suivez vos démarches : à traiter, envoyée, entretien, offre reçue",
    cta: "Ouvrir le suivi →",
  },
  {
    href: "/entretiens",
    icon: Mic,
    color: "#10B981",
    title: "Simulateur d'entretien",
    desc: "Préparez vos entretiens avec un recruteur IA vocal",
    cta: "Démarrer une simulation →",
  },
] as const;

export function TalentHubHomeCards() {
  if (!isDigimytchTalentHub()) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      {MODULES.map((module) => (
        <Link key={module.href} href={module.href} className="group block h-full">
          <div className="h-full border border-[var(--digi-border)] rounded-xl p-5 bg-white group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
            <div className="flex items-start gap-3 mb-3">
              <div
                className="p-2 rounded-lg shrink-0"
                style={{ background: `${module.color}18` }}
              >
                <module.icon size={20} style={{ color: module.color }} aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--digi-dark)] group-hover:text-[var(--digi-navy)]">
                  {module.title}
                </h3>
                <p className="text-sm text-[var(--digi-muted)] mt-1">{module.desc}</p>
              </div>
            </div>
            <span
              className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ color: module.color }}
            >
              {module.cta}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
