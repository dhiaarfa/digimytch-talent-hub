/** Barre de progression discrète — pas de spinner plein écran. */
export function DigimytchRouteLoading() {
  return (
    <div
      className="h-0.5 w-full overflow-hidden bg-[var(--digi-border,#e2e8f0)]/60"
      role="status"
      aria-label="Chargement"
    >
      <div className="digimytch-nav-progress-bar h-full w-1/4 bg-gradient-to-r from-[#030A8C] via-[#D10069] to-[#030A8C]" />
    </div>
  );
}
