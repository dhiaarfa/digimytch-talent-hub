export default function JobsLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 border-2 border-[#D10069] border-t-transparent rounded-full animate-spin"
          aria-hidden
        />
        <p className="text-sm text-[var(--digi-muted)]">Chargement des offres…</p>
      </div>
    </div>
  );
}
