import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiPoweredBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-800 dark:border-violet-800/40 dark:bg-violet-950/30 dark:text-violet-200",
        className
      )}
    >
      <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
      Propulsé par OpenRouter — Kimi K2
    </span>
  );
}
