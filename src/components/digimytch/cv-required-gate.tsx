import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CvRequiredGateProps {
  feature: string; // e.g. "l'analyse d'offres" or "les formations personnalisées"
}

/**
 * Shown when a feature requires a base CV and the user has none.
 * Blocks access to the page and guides the user to create their first CV.
 */
export function CvRequiredGate({ feature }: CvRequiredGateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full text-center space-y-6 animate-fade-in-up">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[#030A8C]/10 to-[#D10069]/10 flex items-center justify-center">
          <FileText className="h-10 w-10 text-[var(--digi-navy)]" aria-hidden />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold text-[var(--digi-dark)] dark:text-[var(--digi-dark-fg)]">
            CV requis
          </h2>
          <p className="text-[var(--digi-muted)] leading-relaxed">
            Pour accéder à {feature}, vous devez d&apos;abord créer votre{" "}
            <strong className="text-[var(--digi-navy)] dark:text-[var(--digi-dark-fg)]">CV de base</strong>.
            Il servira de référence pour calculer votre score de compatibilité.
          </p>
        </div>

        {/* Steps */}
        <ol className="text-left space-y-2 text-sm text-[var(--digi-muted)]">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--digi-accent)]/10 text-[var(--digi-accent)] text-xs font-bold flex items-center justify-center">1</span>
            Allez dans <strong className="text-[var(--digi-dark)] dark:text-[var(--digi-dark-fg)]">Mon CV</strong> et créez un CV de base
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--digi-accent)]/10 text-[var(--digi-accent)] text-xs font-bold flex items-center justify-center">2</span>
            Remplissez vos expériences, compétences et formations
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--digi-accent)]/10 text-[var(--digi-accent)] text-xs font-bold flex items-center justify-center">3</span>
            Revenez ici — votre score sera calculé automatiquement
          </li>
        </ol>

        {/* CTA */}
        <Button asChild className="btn-digi-primary gap-2">
          <Link href="/resumes">
            Créer mon CV de base
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}
