"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const CATEGORY_RULES: { label: string; test: (s: string) => boolean }[] = [
  { label: "Méthodes", test: (s) => /scrum|agile|kanban|project|stakeholder|communication/.test(s) },
  { label: "Backend", test: (s) => /java|spring|node|python|sql|api|rest|microservice|kafka/.test(s) },
  { label: "Frontend", test: (s) => /react|typescript|redux|css|next|vue|angular|figma|ux|ui/.test(s) },
  { label: "Cloud & DevOps", test: (s) => /docker|kubernetes|aws|linux|cicd|devops|monitoring|etl|airflow/.test(s) },
  { label: "Data & IA", test: (s) => /machine learning|pytorch|nlp|data|power bi|spark|ia|ai/.test(s) },
];

function categorizeSkill(raw: string): string {
  const s = raw.toLowerCase().replace(/[.\s/_-]+/g, "");
  for (const rule of CATEGORY_RULES) {
    if (rule.test(s)) return rule.label;
  }
  return "Autres";
}

function dedupeSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const skill of skills) {
    const key = skill.toLowerCase().replace(/[.\s/_-]+/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(skill.trim());
  }
  return out;
}

export function SkillGapChips({
  skills,
  maxVisible = 12,
  className,
}: {
  skills: string[];
  maxVisible?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const unique = useMemo(() => dedupeSkills(skills), [skills]);

  const grouped = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const skill of unique) {
      const cat = categorizeSkill(skill);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(skill);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr"));
  }, [unique]);

  if (unique.length === 0) return null;

  const flat = grouped.flatMap(([, items]) => items);
  const visible = expanded ? flat : flat.slice(0, maxVisible);

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-xs text-[var(--digi-muted)]">
        {unique.length} compétence{unique.length > 1 ? "s" : ""} à renforcer — regroupées par thème
      </p>
      <div className="flex flex-wrap gap-2">
        {visible.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          >
            {skill}
          </span>
        ))}
      </div>
      {flat.length > maxVisible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-[var(--digi-accent)] hover:underline"
        >
          {expanded ? "Réduire" : `Voir les ${flat.length - maxVisible} autres compétences`}
        </button>
      )}
      {!expanded && grouped.length > 1 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {grouped.map(([category, items]) => (
            <div
              key={category}
              className="rounded-lg border border-[var(--digi-border)] bg-[var(--digi-surface)] px-3 py-2"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--digi-muted)] mb-1">
                {category}
              </p>
              <p className="text-xs text-[var(--digi-dark)] dark:text-[var(--digi-dark-fg)] leading-relaxed">
                {items.slice(0, 4).join(" · ")}
                {items.length > 4 ? "…" : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
