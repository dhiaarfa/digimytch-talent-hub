import { getGreeting } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function DigimytchWelcome({ firstName }: { firstName?: string | null }) {
  const name = firstName?.trim() || "là";
  const greeting = getGreeting();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--digi-border)] bg-gradient-to-br from-[var(--digi-navy)] via-[#1a0850] to-[var(--color-accent-magenta)] px-6 py-5 text-white animate-fade-in-up">
      {/* Decorative orb */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-white/60 font-medium uppercase tracking-widest mb-1">
            Tableau de bord
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
            {greeting}, <span className="text-[#ffb8d9]">{name}</span> 👋
          </h1>
          <p className="text-sm text-white/65 mt-1.5 max-w-md">
            CV · Offres d&apos;emploi · Formations · Entretiens — tout en un seul endroit.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-[#ffb8d9]" aria-hidden />
          IA activée
        </div>
      </div>
    </div>
  );
}
