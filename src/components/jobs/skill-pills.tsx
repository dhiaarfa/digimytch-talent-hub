"use client";

import Link from "next/link";
import { Plus, Globe } from "lucide-react";

interface SkillPillsProps {
  matched: string[];
  missing: string[];
  languages?: { label: string; ok: boolean }[];
}

export function SkillPills({ matched, missing, languages }: SkillPillsProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--digi-muted)] mb-2">
          Compétences reconnues
        </p>
        <div className="flex flex-wrap gap-2">
          {matched.length === 0 ? (
            <span className="text-sm text-[var(--digi-muted)]">—</span>
          ) : (
            matched.map((s, i) => (
              <span
                key={`matched-${i}-${s}`}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"
              >
                {s}
              </span>
            ))
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--digi-muted)] mb-2">
          Compétences manquantes
        </p>
        <div className="flex flex-wrap gap-2">
          {missing.length === 0 ? (
            <span className="text-sm text-[var(--digi-muted)]">—</span>
          ) : (
            missing.map((s, i) => (
              <span
                key={`missing-${i}-${s}`}
                className="group px-2.5 py-1 rounded-full text-xs border border-dashed border-gray-300 text-gray-600 bg-gray-50 flex items-center gap-1 hover:border-[var(--digi-accent)] hover:bg-red-50 transition-colors"
                title="Ajouter à votre CV"
              >
                <Plus className="h-3 w-3" aria-hidden />
                {s}
                <Link
                  href="/formations"
                  className="hidden group-hover:inline text-[var(--digi-accent)] ml-1"
                >
                  → formation
                </Link>
              </span>
            ))
          )}
        </div>
      </div>
      {languages && languages.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--digi-muted)] mb-2 flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" aria-hidden />
            Langues
          </p>
          <ul className="text-sm space-y-1">
            {languages.map((l) => (
              <li key={l.label} className={l.ok ? "text-emerald-700" : "text-amber-700"}>
                {l.label} {l.ok ? "✓" : "⚠"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
