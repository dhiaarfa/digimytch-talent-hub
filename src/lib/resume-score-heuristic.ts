import { computeResumeJobMatch } from "@/lib/matching";
import type { ResumeScoreMetrics } from "@/lib/zod-schemas";
import type { Job, Resume } from "@/lib/types";

export type JobScoringInput = Pick<
  Job,
  "company_name" | "position_title" | "description" | "keywords"
>;

function toJobRow(job: JobScoringInput, userId: string): Job {
  return {
    id: "heuristic-score",
    user_id: userId,
    company_name: job.company_name ?? "",
    position_title: job.position_title ?? "",
    job_url: null,
    description: job.description ?? null,
    location: null,
    salary_range: null,
    keywords: job.keywords ?? [],
    work_location: null,
    employment_type: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  };
}

function metric(score: number, reason: string) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  return { score: clamped, reason };
}

/**
 * Score CV exploitable sans IA (secours quand generateObject échoue sur les modèles gratuits).
 */
export function buildHeuristicResumeScore(
  resume: Resume,
  job?: JobScoringInput | null
): ResumeScoreMetrics {
  const hasContact = Boolean(resume.email?.trim() && resume.phone_number?.trim());
  const expCount = resume.work_experience?.length ?? 0;
  const eduCount = resume.education?.length ?? 0;
  const skillCount =
    resume.skills?.reduce((n, g) => n + (g.items?.length ?? 0), 0) ?? 0;

  let overall = 45;
  if (hasContact) overall += 12;
  if (expCount > 0) overall += 18;
  if (eduCount > 0) overall += 10;
  if (skillCount >= 5) overall += 12;
  else if (skillCount > 0) overall += 6;
  overall = Math.min(82, overall);

  const note =
    "Score calculé localement (analyse IA indisponible ou trop lente). Fiable pour complétude et mots-clés — utilisez « Recalculer » pour tenter une analyse IA détaillée.";

  const base: ResumeScoreMetrics = {
    overallScore: metric(overall, `Complétude générale du CV. ${note}`),
    completeness: {
      contactInformation: metric(
        hasContact ? 85 : 45,
        hasContact ? "Coordonnées présentes." : "Ajoutez email et téléphone."
      ),
      detailLevel: metric(
        expCount >= 2 ? 78 : expCount === 1 ? 62 : 38,
        expCount > 0
          ? `${expCount} expérience(s) renseignée(s).`
          : "Ajoutez au moins une expérience professionnelle."
      ),
    },
    impactScore: {
      activeVoiceUsage: metric(68, "Préférez des verbes d'action en début de puce."),
      quantifiedAchievements: metric(
        expCount > 0 ? 58 : 40,
        "Ajoutez chiffres et résultats mesurables dans vos missions."
      ),
    },
    roleMatch: {
      skillsRelevance: metric(
        skillCount >= 8 ? 74 : skillCount > 0 ? 58 : 42,
        skillCount > 0
          ? `${skillCount} compétence(s) listée(s).`
          : "Structurez vos compétences par catégories."
      ),
      experienceAlignment: metric(
        expCount >= 2 ? 72 : expCount === 1 ? 60 : 38,
        "Alignez les intitulés de poste avec votre objectif."
      ),
      educationFit: metric(
        eduCount > 0 ? 70 : 45,
        eduCount > 0 ? "Formation renseignée." : "Ajoutez votre parcours académique."
      ),
    },
    isTailoredResume: Boolean(job && !resume.is_base_resume),
    overallImprovements: [
      "Enrichissez chaque expérience avec 3 à 5 puces orientées résultats.",
      "Vérifiez que vos compétences correspondent à votre poste cible.",
    ],
  };

  if (job) {
    const match = computeResumeJobMatch(resume, toJobRow(job, resume.user_id));
    base.overallScore = metric(
      match.score > 0 ? match.score : overall,
      `Compatibilité estimée avec « ${job.position_title} » (${match.score}/100). ${note}`
    );
    if (!resume.is_base_resume) {
      base.jobAlignment = {
        keywordMatch: {
          ...metric(match.score, "Recoupement mots-clés CV / offre (Score Bridge)."),
          matchedKeywords: match.matchedKeywords.slice(0, 10),
          missingKeywords: match.missingKeywords.slice(0, 10),
        },
        requirementsMatch: {
          ...metric(match.score, "Compétences reconnues vs écarts."),
          matchedRequirements: match.matchedSkills.slice(0, 8),
          gapAnalysis: match.gapSkills.slice(0, 8),
        },
        companyFit: {
          ...metric(Math.max(35, match.score - 8), "Positionnement pour cette entreprise."),
          suggestions: ["Adaptez l'accroche et les mots-clés au secteur de l'offre."],
        },
      };
      base.jobSpecificImprovements =
        match.missingKeywords.length > 0
          ? match.missingKeywords.slice(0, 5).map((k) => `Mettre en avant : ${k}`)
          : ["Votre profil couvre déjà les principaux mots-clés de l'offre."];
    }
  }

  return base;
}
