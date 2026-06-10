export function DigimytchHomeStatsSkeleton() {
  return (
    <div className="space-y-4 mb-6">
      {/* KPI grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-[106px] rounded-2xl skeleton"
            style={{ animationDelay: `${i * 80}ms` }}
            aria-hidden
          />
        ))}
      </div>
      {/* Next action skeleton */}
      <div className="h-[88px] rounded-2xl skeleton" aria-hidden />
    </div>
  );
}
