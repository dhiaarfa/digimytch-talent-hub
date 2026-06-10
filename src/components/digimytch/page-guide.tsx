"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageGuideProps {
  title: string;
  description: string;
  steps?: string[];
  action?: { label: string; href: string };
  backHref?: string;
  backLabel?: string;
}

export function PageGuide({
  title,
  description,
  steps,
  action,
  backHref = "/home",
  backLabel = "Tableau de bord",
}: PageGuideProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="mb-6 space-y-3 animate-fade-in-up">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--digi-muted)] hover:text-[var(--digi-navy)] dark:hover:text-[var(--digi-dark-fg)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--digi-dark)] dark:text-[var(--digi-dark-fg)]">
            {title}
          </h1>
          <p className="text-[var(--digi-muted)] text-sm mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          {action && (
            <Button asChild size="sm" className="btn-digi-primary gap-1.5">
              <Link href={action.href}>
                {action.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          {steps && steps.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--digi-muted)] hover:text-[var(--digi-navy)] dark:hover:text-[var(--digi-dark-fg)] px-2.5 py-1.5 rounded-lg border border-[var(--digi-border)] bg-white/80 dark:bg-[var(--digi-card)] hover:border-[var(--digi-navy)]/30 transition-all"
              aria-expanded={open}
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden />
              Guide
              {open ? (
                <ChevronUp className="h-3 w-3" aria-hidden />
              ) : (
                <ChevronDown className="h-3 w-3" aria-hidden />
              )}
            </button>
          )}
        </div>
      </div>

      {steps && steps.length > 0 && open && (
        <div className="rounded-xl border border-[var(--digi-border)] bg-white/90 dark:bg-[var(--digi-card)] p-4 text-sm animate-fade-in shadow-sm">
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-[var(--digi-muted)]">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--digi-accent)]/10 text-[var(--digi-accent)] text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </header>
  );
}
