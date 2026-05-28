import type { DigiLang } from "@/lib/use-language";

export function appCopy(lang: DigiLang) {
  const en = lang === "en";
  return {
    navHome: en ? "Dashboard" : "Tableau de bord",
    navResume: en ? "My resume" : "Mon CV",
    navJobs: en ? "Analyze a job" : "Analyser une offre",
    navCourses: en ? "Training" : "Formations",
    navApplications: en ? "My applications" : "Mes candidatures",
    navInterviews: en ? "Interviews" : "Entretiens",
    navAdmin: en ? "Administration" : "Administration",
    jobsTitle: en ? "Analyze a job offer" : "Analyser une offre",
    jobsDesc: en
      ? "Paste a job posting. Get a compatibility score with your resume, then track the application in My applications."
      : "Collez le texte d'une annonce. Vous obtenez un score de compatibilité avec votre CV, puis vous pouvez suivre la candidature dans Mes candidatures.",
    jobsStep1: en ? "Paste posting and analyze" : "Coller l'annonce et analyser",
    jobsStep2: en ? "Read score and gaps" : "Lire le score et les écarts",
    jobsStep3: en ? "Add to My applications" : "Ajouter à Mes candidatures",
    jobsAnalyze: en ? "Analyze a job offer" : "Analyser une offre",
    jobsNoResumeTitle: en ? "Create a base resume first" : "Créez un CV de base d'abord",
    jobsNoResumeDesc: en
      ? "The score compares your base resume to the offer. Without a resume, results stay approximate."
      : "Le score compare votre CV de base à l'offre. Sans CV, le résultat reste approximatif.",
    jobsGoResume: en ? "Go to My resume →" : "Aller à Mon CV →",
    jobsEmptyTitle: en ? "No analyzed offers" : "Aucune offre analysée",
    jobsEmptyDesc: en
      ? "Paste a job posting (LinkedIn, Rekrute, Indeed…) to get your score."
      : "Copiez une annonce LinkedIn, Rekrute ou Indeed (au moins quelques lignes) pour obtenir votre score.",
    jobsEmptyCta: en ? "Analyze my first offer" : "Analyser ma première offre",
    jobsYourOffers: en ? "Your offers" : "Vos offres",
    jobsApplications: en ? "My applications" : "Mes candidatures",
    viewGrid: en ? "Grid" : "Grille",
    viewList: en ? "List" : "Liste",
  };
}
