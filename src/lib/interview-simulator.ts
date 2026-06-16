import type { Job, Profile } from "@/lib/types";

export type InterviewMessage = {
  role: "user" | "assistant";
  content: string;
};

export type InterviewScenario = {
  targetRole: string;
  company?: string;
  jobTitle?: string;
  jobId?: string;
};

export const INTERVIEW_MAX_TURNS = 8;

export function isProfileEmpty(profile: Profile | null | undefined): boolean {
  if (!profile) return true;
  return (
    !profile.work_experience?.length &&
    !profile.education?.length &&
    !profile.skills?.length
  );
}

export function buildProfileBrief(profile: Profile): string {
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Candidat";

  const skills =
    profile.skills
      ?.flatMap((s) =>
        s.items?.length
          ? s.items.map((item) => `${s.category}: ${item}`)
          : [s.category]
      )
      .filter(Boolean)
      .slice(0, 25)
      .join(", ") || "non renseignées";

  const experiences =
    profile.work_experience
      ?.slice(0, 6)
      .map(
        (w) =>
          `- ${w.position || "Poste"} @ ${w.company || "Entreprise"} (${w.date || "dates non précisées"})`
      )
      .join("\n") || "- Aucune expérience renseignée";

  const education =
    profile.education
      ?.slice(0, 4)
      .map(
        (e) =>
          `- ${e.degree || e.field || "Formation"} — ${e.school || "Établissement"} (${e.date || ""})`
      )
      .join("\n") || "- Aucune formation renseignée";

  const projects =
    profile.projects
      ?.slice(0, 4)
      .map(
        (p) =>
          `- ${p.name || "Projet"}: ${(Array.isArray(p.description) ? p.description.join(" ") : "").slice(0, 120)}`
      )
      .join("\n") || "";

  return [
    `Nom : ${name}`,
    profile.location ? `Localisation : ${profile.location}` : null,
    `Compétences : ${skills}`,
    `Expériences :\n${experiences}`,
    `Formation :\n${education}`,
    projects ? `Projets :\n${projects}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function scenarioFromJob(job: Job): InterviewScenario {
  return {
    targetRole: job.position_title || "Poste non précisé",
    company: job.company_name || undefined,
    jobTitle: job.position_title || undefined,
    jobId: job.id,
  };
}

export const INTERVIEW_RECRUITER_RULES = `Tu es Sarra, recruteuse tunisienne. Entretien en français uniquement (termes tech OK).

Règles :
- UNE question à la fois, max 35 mots au total (transition courte + question)
- Réagis en 1 phrase à la réponse du candidat, puis enchaîne
- Alterne motivation, STAR, technique lié au poste
- Ne compte pas les mots, ne réfléchis pas à voix haute, pas d'anglais

Interdit : "Voici", "Je vais", "Let's", plusieurs questions, débrief final.

Premier tour : présentation en 1 phrase + question d'ouverture simple.`;



export function buildRecruiterSystemPrompt(
  profileBrief: string,
  scenario: InterviewScenario
): string {
  const companyLine = scenario.company
    ? `Entreprise / contexte : ${scenario.company}${scenario.jobTitle ? ` — ${scenario.jobTitle}` : ""}.`
    : "Entretien général (pas d'entreprise précise).";

  return [
    INTERVIEW_RECRUITER_RULES,
    companyLine,
    `Poste : ${scenario.targetRole}.`,
    "Profil candidat :",
    profileBrief,
  ].join("\n");
}

export function buildDebriefSystemPrompt(
  profileBrief: string,
  scenario: InterviewScenario
): string {
  return [
    "Tu es Sarra, coach carrière senior chez Digimytch Talent Hub (Tunisie).",
    "LANGUE : réponds EXCLUSIVEMENT en français. Aucune phrase en anglais.",
    "",
    "Le candidat vient de terminer une simulation d'entretien. Produis un bilan court, honnête, bienveillant et 100% actionnable.",
    "",
    `Poste visé : ${scenario.targetRole}.`,
    scenario.company ? `Contexte : ${scenario.company}.` : "",
    "",
    "PROFIL DU CANDIDAT :",
    profileBrief,
    "",
    "RÈGLES DU DÉBRIEF :",
    "- Base-toi UNIQUEMENT sur ce qui a été dit dans la conversation. N'invente aucune information absente.",
    "- Si la conversation est courte, adapte le bilan à ce qui est disponible sans noyer le candidat.",
    "- Sois direct et honnête : signale les vraies lacunes, pas seulement les points positifs.",
    "- Donne des conseils CONCRETS : formulations à utiliser, méthodes à appliquer (STAR, etc.).",
    "- N'écris pas tes réflexions internes. Va directement au bilan.",
    "",
    "Structure attendue (titres en gras markdown) :",
    "**Ce qui a bien fonctionné** (2 à 3 puces basées sur des éléments réels de la conversation)",
    "**Ce qui peut être amélioré** (2 à 3 axes concrets avec exemples de formulations recommandées)",
    "**Action prioritaire avant le prochain entretien** (1 conseil précis et applicable immédiatement)",
  ].join("\n");
}
