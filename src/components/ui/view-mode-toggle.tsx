"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

export function ViewModeToggle({
  value,
  onChange,
  className,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-[var(--digi-border)] p-0.5 bg-white/80 dark:bg-[var(--digi-card)]",
        className
      )}
      role="group"
      aria-label="Mode d'affichage"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          value === "grid"
            ? "bg-[var(--digi-navy)] text-white"
            : "text-[var(--digi-muted)] hover:text-[var(--digi-navy)]"
        )}
        title="Grille"
      >
        <LayoutGrid size={16} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          value === "list"
            ? "bg-[var(--digi-navy)] text-white"
            : "text-[var(--digi-muted)] hover:text-[var(--digi-navy)]"
        )}
        title="Liste"
      >
        <List size={16} aria-hidden />
      </button>
    </div>
  );
}
