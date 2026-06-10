import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { getCachedQuickStats } from "@/lib/digimytch-queries";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "account", label: "Créer un compte", href: "/home", done: () => true },
  {
    id: "profile",
    label: "Compléter votre profil",
    href: "/profile",
    done: (s: NonNullable<Awaited<ReturnType<typeof getCachedQuickStats>>>) =>
      s.profileComplete,
  },
  {
    id: "cv",
    label: "Créer votre CV de base",
    href: "/resumes",
    done: (s: NonNullable<Awaited<ReturnType<typeof getCachedQuickStats>>>) =>
      s.hasResume,
  },
  {
    id: "job",
    label: "Analyser votre première offre",
    href: "/jobs",
    done: (s: NonNullable<Awaited<ReturnType<typeof getCachedQuickStats>>>) =>
      s.jobsCount > 0,
  },
  {
    id: "interview",
    label: "Simuler un entretien",
    href: "/entretiens",
    done: (s: NonNullable<Awaited<ReturnType<typeof getCachedQuickStats>>>) =>
      s.hasInterview,
  },
] as const;

export async function OnboardingProgress() {
  let stats: Awaited<ReturnType<typeof getCachedQuickStats>> = null;
  try {
    stats = await getCachedQuickStats();
  } catch {
    return null;
  }
  if (!stats) return null;

  const completed = STEPS.filter((step) => step.done(stats!)).length;
  if (completed >= STEPS.length) return null;

  return (
    <section
      className="rounded-2xl border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] p-4 sm:p-5 mb-4"
      aria-label="Progression onboarding"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--digi-muted)]">
            Parcours candidat
          </p>
          <p className="text-sm font-medium text-[var(--digi-dark)]">
            {completed}/{STEPS.length} étapes complétées
          </p>
        </div>
        <div className="h-2 flex-1 min-w-[120px] max-w-xs rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#030A8C] to-[#D10069] transition-all"
            style={{ width: `${(completed / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step, i) => {
          const isDone = step.done(stats!);
          const isCurrent = !isDone && STEPS.slice(0, i).every((s) => s.done(stats!));
          return (
            <li key={step.id}>
              <Link
                href={step.href}
                className={cn(
                  "flex items-start gap-2 rounded-xl border p-3 text-left transition-colors h-full",
                  isDone && "border-emerald-200 bg-emerald-50/80",
                  isCurrent && "border-[var(--digi-accent)] bg-[var(--digi-accent)]/5 ring-1 ring-[var(--digi-accent)]/30",
                  !isDone && !isCurrent && "border-[var(--digi-border)] hover:bg-[var(--digi-surface)]"
                )}
              >
                {isDone ? (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                ) : (
                  <Circle
                    className={cn(
                      "h-4 w-4 shrink-0 mt-0.5",
                      isCurrent ? "text-[var(--digi-accent)]" : "text-gray-300"
                    )}
                    aria-hidden
                  />
                )}
                <span className="text-xs leading-snug">
                  <span className="text-[var(--digi-muted)]">Étape {i + 1}</span>
                  <br />
                  <span className="font-medium text-[var(--digi-dark)]">{step.label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
