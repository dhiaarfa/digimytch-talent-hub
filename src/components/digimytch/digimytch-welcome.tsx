import { getGreeting } from "@/lib/utils";

export function DigimytchWelcome({
  firstName,
}: {
  firstName?: string | null;
}) {
  const name = firstName?.trim() || "Admin";
  const greeting = getGreeting();

  return (
    <div className="rounded-xl border border-[var(--digi-border)] bg-gradient-to-br from-white to-[var(--digi-surface)] px-5 py-4">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--digi-navy)]">
        {greeting}, {name}
      </h1>
      <p className="text-sm text-[var(--digi-muted)] mt-1">
        Votre tableau de bord carrière — CV, analyse d&apos;offres, formations et candidatures.
      </p>
    </div>
  );
}
