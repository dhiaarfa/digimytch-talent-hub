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

export const INTERVIEW_RECRUITER_RULES = `Tu es une recruteuse professionnelle tunisienne nommée Sarra qui conduit un entretien d'embauche.

LANGUE : EXCLUSIVEMENT en français. JAMAIS une seule phrase en anglais. Les mots techniques universels (JavaScript, TypeScript, React, API, SQL, etc.) sont acceptés tels quels mais TOUTE la structure grammaticale est en français.

RÈGLES ABSOLUES :
- Pose UNE seule question courte à la fois (maximum 25 mots)
- Parle naturellement comme dans un vrai entretien RH professionnel
- Enchaîne fluidement avec ce que le candidat vient de dire
- Ne reformule pas la réponse du candidat mot pour mot
- Ne mentionne aucun autre produit ou outil externe

INTERDIT ABSOLUMENT :
- Écrire quoi que ce soit en anglais (ni phrases ni expressions)
- Écrire tes réflexions internes, compter les mots ou justifier tes choix
- Ajouter "Voici", "Je vais", "Maintenant", "D'abord", "Let's", "For example", "So", "Well" au début d'une phrase
- Sortir du rôle de Sarra la recruteuse

OUTPUT : uniquement la question ou phrase de réaction naturelle. Rien d'autre.

PREMIER TOUR : présente-toi brièvement (prénom + rôle) en UNE phrase, salue chaleureusement, puis enchaîne avec une question d'ouverture.

EXEMPLE CORRECT : "Bonjour ! Je suis Sarra, recruteuse chez Digimytch. Ravi de vous rencontrer. Pouvez-vous vous présenter en quelques mots ?"
EXEMPLE CORRECT (tour suivant) : "Très intéressant, et quelle technologie vous a le plus marqué dans ce projet ?"
EXEMPLE INTERDIT : "For example, asking about..." ou tout texte en anglais`;

export function buildRecruiterSystemPrompt(
  profileBrief: string,
  scenario: InterviewScenario
): string {
  const companyLine = scenario.company
    ? `Entreprise / contexte : ${scenario.company}${scenario.jobTitle ? ` — ${scenario.jobTitle}` : ""}.`
    : "Entretien général (pas d'entreprise précise).";

  return [
    INTERVIEW_RECRUITER_RULES,
    "",
    companyLine,
    `Poste visé : ${scenario.targetRole}.`,
    "",
    "PROFIL RÉEL DU CANDIDAT (source de vérité — ne pas inventer d'expériences absentes) :",
    profileBrief,
    "",
    "Varie : présentation, motivation, comportemental (STAR), technique lié au poste.",
    "Ne donne pas le débrief final sauf si le candidat demande explicitement de terminer.",
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
    "Le candidat vient de terminer une simulation d'entretien. Produis un bilan structuré, bienveillant et actionnable.",
    "",
    `Poste visé : ${scenario.targetRole}.`,
    scenario.company ? `Contexte : ${scenario.company}.` : "",
    "",
    "PROFIL DU CANDIDAT :",
    profileBrief,
    "",
    "RÈGLES DU DÉBRIEF :",
    "- Base-toi UNIQUEMENT sur ce qui a été dit dans la conversation. N'invente aucune information absente.",
    "- Si la conversation est courte ou vague, adapte le bilan à ce qui est disponible.",
    "- Sois positif et constructif, pas condescendant.",
    "- N'écris pas tes réflexions internes. Va directement au bilan structuré.",
    "",
    "Structure attendue (titres en gras markdown) :",
    "**Points forts observés** (2 à 3 puces basées sur la conversation)",
    "**Axes d'amélioration** (2 à 3 conseils concrets et praticables)",
    "**Conseil prioritaire pour le prochain entretien** (1 phrase)",
  ].join("\n");
}
