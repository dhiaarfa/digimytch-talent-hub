"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, Globe, BookOpen } from "lucide-react";

interface SkillPillsProps {
  matched: string[];
  missing: string[];
  languages?: { label: string; ok: boolean }[];
}

export function SkillPills({ matched, missing, languages }: SkillPillsProps) {
  return (
    <div className="space-y-4">
      {/* Matched */}
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Reconnues ({matched.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {matched.length === 0 ? (
            <span className="text-sm text-[var(--digi-muted)]">Aucune compétence détectée</span>
          ) : (
            matched.map((s, i) => (
              <span
                key={`m-${i}-${s}`}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50"
              >
                ✓ {s}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Missing */}
      {missing.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-500 mb-2">
            <XCircle className="h-3.5 w-3.5" aria-hidden />
            Manquantes ({missing.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((s, i) => (
              <Link
                key={`gap-${i}-${s}`}
                href={`/formations`}
                className="group flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-dashed border-red-200 text-red-600 bg-red-50/60 hover:bg-red-100 hover:border-red-400 dark:bg-red-950/20 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                title={`Trouver une formation pour ${s}`}
              >
                <BookOpen className="h-3 w-3 opacity-60 group-hover:opacity-100" aria-hidden />
                {s}
              </Link>
            ))}
          </div>
          <p className="text-xs text-[var(--digi-muted)] mt-2">
            Cliquez sur une compétence pour trouver une formation adaptée.
          </p>
        </div>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--digi-muted)] mb-2">
            <Globe className="h-3.5 w-3.5" aria-hidden />
            Langues
          </p>
          <div className="flex flex-wrap gap-1.5">
            {languages.map((l) => (
              <span
                key={l.label}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  l.ok
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50"
                    : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300"
                }`}
              >
                {l.label} {l.ok ? "✓" : "~"}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
