import { cn, formatResumeDate } from "@/lib/utils";
import { Mail } from "lucide-react";

interface MiniLetterPreviewProps {
  name: string;
  target_role?: string;
  jobTitle?: string;
  updatedAt?: string;
  createdAt?: string;
  hasContent?: boolean;
  className?: string;
}

export function MiniLetterPreview({
  name,
  target_role,
  jobTitle,
  updatedAt,
  createdAt,
  hasContent = false,
  className,
}: MiniLetterPreviewProps) {
  const dateLabel = updatedAt || createdAt;

  return (
    <div
      className={cn(
        "relative w-full aspect-[8.5/11] rounded-lg overflow-hidden border shadow-lg",
        "border-amber-200 bg-gradient-to-b from-amber-50/90 to-white",
        "transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
        "shadow-amber-500/15 hover:shadow-amber-500/25 group",
        className
      )}
    >
      <div className="relative h-full p-4 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3 pb-2 border-b border-amber-200/80">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{name}</h3>
            {jobTitle && (
              <p className="text-[10px] text-amber-800/80 mt-0.5 line-clamp-1">{jobTitle}</p>
            )}
          </div>
          <div className="shrink-0 p-1.5 rounded-md bg-amber-100">
            <Mail className="h-3.5 w-3.5 text-amber-700" aria-hidden />
          </div>
        </div>

        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 mb-3 w-fit">
          {hasContent ? "Lettre rédigée" : "Brouillon"}
        </div>

        {target_role && (
          <p className="text-[10px] text-gray-500 mb-3 line-clamp-2">{target_role}</p>
        )}

        <div className="flex-1 space-y-2">
          <div className="h-1 w-20 rounded-full bg-amber-300/60" />
          {[0.95, 0.88, 0.92, 0.85, 0.9].map((w, i) => (
            <div
              key={i}
              className="h-1 rounded-full bg-amber-100"
              style={{ width: `${w * 100}%` }}
            />
          ))}
        </div>

        {dateLabel && (
          <p className="mt-auto pt-2 text-[10px] font-medium text-gray-500 tabular-nums">
            {formatResumeDate(dateLabel)}
          </p>
        )}
      </div>
    </div>
  );
}
