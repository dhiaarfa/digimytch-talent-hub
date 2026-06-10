import { cn, formatResumeDate } from "@/lib/utils";

interface MiniResumePreviewProps {
  name: string;
  type: "base" | "tailored";
  updatedAt?: string;
  createdAt?: string;
  target_role?: string;
  className?: string;
}

export function MiniResumePreview({
  name,
  type,
  createdAt,
  updatedAt,
  target_role,
  className,
}: MiniResumePreviewProps) {
  const dateLabel = updatedAt || createdAt;
  const isBase = type === "base";

  return (
    <div
      className={cn(
        "relative w-full aspect-[8.5/11] rounded-lg overflow-hidden border shadow-lg bg-white",
        "transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group",
        isBase
          ? "border-violet-200 shadow-violet-500/15 hover:shadow-violet-500/25"
          : "border-pink-200 shadow-rose-500/15 hover:shadow-rose-500/25",
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.02)_50%,transparent_100%)]" />

      <div className="relative h-full p-4 flex flex-col">
        <div className="text-center mb-2 pb-2 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
            {name}
          </h3>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
              isBase ? "bg-violet-100 text-violet-700" : "bg-pink-100 text-pink-700"
            )}
          >
            {isBase ? "CV de base" : "CV sur mesure"}
          </span>
        </div>

        {target_role && (
          <p className="text-[10px] text-center text-gray-500 mb-2 line-clamp-2 px-1">
            {target_role}
          </p>
        )}

        <div className="flex-1 space-y-3 min-h-0">
          <div className="flex justify-center gap-1.5">
            {[12, 12, 12].map((w, i) => (
              <div key={i} className="h-1 rounded-full bg-gray-200" style={{ width: w * 4 }} />
            ))}
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-14 rounded-full bg-gray-300 mx-auto" />
            {[0.95, 0.85, 0.9].map((w, i) => (
              <div
                key={i}
                className="h-1 rounded-full bg-gray-200 mx-auto"
                style={{ width: `${w * 100}%` }}
              />
            ))}
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-16 rounded-full bg-gray-300" />
            {[0.85, 0.9].map((w, i) => (
              <div
                key={i}
                className="h-1 rounded-full bg-gray-200"
                style={{ width: `${w * 100}%` }}
              />
            ))}
          </div>
        </div>

        {dateLabel && (
          <p className="mt-auto pt-2 text-[10px] font-medium text-gray-500 text-center tabular-nums">
            {formatResumeDate(dateLabel)}
          </p>
        )}
      </div>

      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
          isBase
            ? "bg-gradient-to-br from-violet-500/5 to-indigo-500/5"
            : "bg-gradient-to-br from-pink-500/5 to-rose-500/5"
        )}
      />
    </div>
  );
}
