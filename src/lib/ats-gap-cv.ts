import type { Resume } from "@/lib/types";

/** Shape sent to POST /api/cv/ats-gap — mirrors resume JSONB sections (not a single `content` column). */
export interface AtsCvContent {
  target_role?: string;
  professional_summary?: string;
  work_experience?: unknown[];
  education?: unknown[];
  skills?: unknown[];
  projects?: unknown[];
  certifications?: unknown[];
}

export function resumeToCvContent(
  resume: Resume & { professional_summary?: string; certifications?: unknown[] }
): AtsCvContent {
  return {
    target_role: resume.target_role,
    professional_summary: resume.professional_summary ?? "",
    work_experience: resume.work_experience ?? [],
    education: resume.education ?? [],
    skills: resume.skills ?? [],
    projects: resume.projects ?? [],
    certifications: resume.certifications ?? [],
  };
}

const MAX_PROMPT_CHARS = 12_000;

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

/** Compact French-friendly text for the ATS gap prompt. */
export function buildAtsCvTextForPrompt(content: AtsCvContent): string {
  const skills =
    (content.skills as { category?: string; items?: string[] }[] | undefined)
      ?.map((g) => `${g.category ?? "Compétences"}: ${(g.items ?? []).join(", ")}`)
      .join("\n") ?? "—";

  const experiences =
    (content.work_experience as {
      position?: string;
      company?: string;
      date?: string;
      description?: string[];
    }[])?.slice(0, 8)
      .map((exp) => {
        const bullets = (exp.description ?? []).slice(0, 3);
        return [
          `${exp.position ?? "—"} — ${exp.company ?? "—"} (${exp.date ?? "—"})`,
          ...bullets.map((b) => `  • ${clip(String(b), 180)}`),
        ].join("\n");
      })
      .join("\n\n") ?? "—";

  const education =
    (content.education as { degree?: string; school?: string; field?: string }[])
      ?.slice(0, 5)
      .map((e) => `${e.degree ?? "—"} — ${e.school ?? "—"} (${e.field ?? ""})`)
      .join("\n") ?? "—";

  const summary = content.professional_summary?.trim() || content.target_role?.trim() || "—";

  const parts = [
    `Résumé / poste visé:\n${summary}`,
    "",
    "Expériences:",
    experiences,
    "",
    "Compétences:",
    skills,
    "",
    "Formation:",
    education,
  ];

  return clip(parts.join("\n"), MAX_PROMPT_CHARS);
}
