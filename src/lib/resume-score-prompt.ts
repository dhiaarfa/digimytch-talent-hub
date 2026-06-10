import type { Resume } from "@/lib/types";
import type { JobScoringInput } from "@/lib/resume-score-heuristic";

const MAX_PROMPT_CHARS = 10_000;

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function buildCompactResumeScoreText(resume: Resume): string {
  const skillLines =
    resume.skills
      ?.map((g) => `${g.category}: ${(g.items ?? []).join(", ")}`)
      .filter(Boolean)
      .slice(0, 12) ?? [];

  const expLines =
    resume.work_experience?.slice(0, 10).map((exp) => {
      const bullets = (exp.description ?? []).filter(Boolean).slice(0, 4);
      return [
        `${exp.position} — ${exp.company} (${exp.date})`,
        ...bullets.map((b) => `  • ${clip(String(b), 200)}`),
      ].join("\n");
    }) ?? [];

  const eduLines =
    resume.education?.slice(0, 6).map(
      (edu) => `${edu.degree} — ${edu.school} (${edu.date})`
    ) ?? [];

  const parts = [
    `Poste visé: ${resume.target_role || "—"}`,
    `CV de base: ${resume.is_base_resume ? "oui" : "non"}`,
    `Contact: ${resume.first_name} ${resume.last_name} | ${resume.email} | ${resume.phone_number ?? ""} | ${resume.location ?? ""}`,
    "",
    "Expériences:",
    expLines.length ? expLines.join("\n") : "—",
    "",
    "Formation:",
    eduLines.length ? eduLines.join("\n") : "—",
    "",
    "Compétences:",
    skillLines.length ? skillLines.join("\n") : "—",
  ];

  return clip(parts.join("\n"), MAX_PROMPT_CHARS);
}

export function buildCompactJobScoreText(job: JobScoringInput): string {
  const kw = (job.keywords ?? []).slice(0, 40).join(", ");
  return clip(
    [
      `Entreprise: ${job.company_name ?? "—"}`,
      `Poste: ${job.position_title ?? "—"}`,
      `Mots-clés: ${kw || "—"}`,
      "",
      "Description:",
      job.description ?? "—",
    ].join("\n"),
    6_000
  );
}
