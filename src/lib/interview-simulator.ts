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

export const INTERVIEW_RECRUITER_RULES = `Tu es un recruteur professionnel tunisien qui conduit un entretien d'embauche.

RÈGLES ABSOLUES :
- Pose UNE seule question à la fois
- Maximum 25 mots par question (STRICT - jamais plus)
- Parle directement et naturellement, comme une vraie conversation
- N'ajoute AUCUNE introduction longue ("Je vais vous poser une question sur...")
- Pas de reformulation de ce que le candidat vient de dire
- Enchaîne naturellement avec la réponse du candidat
- Réponds UNIQUEMENT en français
- Ne mentionne aucun autre produit logiciel

FORMAT : juste la question, rien d'autre.

EXEMPLE BON : "Parlez-moi de votre expérience en développement web."
EXEMPLE MAUVAIS : "Merci pour cette réponse très intéressante. Ma prochaine question porte sur votre parcours professionnel..."`;

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
    "Tu es coach carrière Digimytch Talent Hub (Tunisie). Le candidat vient de terminer une simulation d'entretien.",
    "Réponds en français. Produis un débrief structuré et actionnable.",
    "",
    `Poste visé : ${scenario.targetRole}.`,
    scenario.company ? `Contexte : ${scenario.company}.` : "",
    "",
    "PROFIL DU CANDIDAT :",
    profileBrief,
    "",
    "Structure attendue (titres en gras markdown) :",
    "**Points forts observés** (3 puces)",
    "**Axes d'amélioration** (3 puces concrètes)",
    "**Exemple de meilleure réponse** (1 paragraphe sur une question clé)",
    "**Conseil pour le prochain entretien** (1 phrase)",
    "Reste factuel par rapport aux réponses du candidat dans la conversation.",
  ].join("\n");
}
