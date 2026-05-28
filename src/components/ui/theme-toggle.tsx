"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center h-8 w-8 rounded-lg border border-[var(--digi-border)]",
        "text-[var(--digi-navy)] hover:bg-white/80 dark:text-[var(--digi-dark-fg)] dark:hover:bg-white/10",
        "transition-colors",
        className
      )}
      title={theme === "light" ? "Mode sombre" : "Mode clair"}
      aria-label={theme === "light" ? "Activer le mode sombre" : "Activer le mode clair"}
    >
      {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  );
}
