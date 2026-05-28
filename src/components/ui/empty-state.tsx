import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl bg-[var(--digi-surface)] border border-[var(--digi-border)]",
        className
      )}
    >
      <div className="rounded-full bg-white p-4 shadow-sm mb-4">
        <Icon className="h-12 w-12 text-[var(--digi-muted)]" strokeWidth={1} aria-hidden />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--digi-dark)]">{title}</h3>
      <p className="text-sm text-[var(--digi-muted)] mt-2 max-w-md leading-relaxed">{description}</p>
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Button asChild className="bg-[var(--digi-accent)] hover:opacity-90">
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={action.onClick}
              className="bg-[var(--digi-accent)] hover:opacity-90"
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
