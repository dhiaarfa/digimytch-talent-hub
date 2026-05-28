export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-[var(--digi-border)]/60" />
      <div className="h-4 w-full max-w-md rounded bg-[var(--digi-border)]/40" />
      <div className="grid gap-3 sm:grid-cols-2 mt-6">
        <div className="h-32 rounded-xl bg-[var(--digi-border)]/30" />
        <div className="h-32 rounded-xl bg-[var(--digi-border)]/30" />
      </div>
    </div>
  );
}
