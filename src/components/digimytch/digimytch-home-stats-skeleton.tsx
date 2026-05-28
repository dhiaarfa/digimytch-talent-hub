export function DigimytchHomeStatsSkeleton() {
  return (
    <div className="space-y-6 mb-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-white border border-[var(--digi-border)]"
          />
        ))}
      </div>
      <div className="h-24 rounded-xl bg-white border border-[var(--digi-border)]" />
    </div>
  );
}
