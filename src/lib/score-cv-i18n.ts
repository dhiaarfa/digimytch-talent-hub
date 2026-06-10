import type { DigiLang } from "@/lib/use-language";

export function scoreCvCopy(lang: DigiLang) {
  const en = lang === "en";
  return {
    tabImport: en ? "Bring my CV" : "Apporter mon CV",
    tabExisting: en ? "My platform CV" : "Mon CV sur la plateforme",
    importHint: en
      ? "Paste your CV text (Word, PDF export, LinkedIn…). Nothing is saved until you create a resume in CV & letters."
      : "Collez le texte de votre CV (export Word/PDF, LinkedIn…). Rien n'est enregistré tant que vous ne créez pas un CV dans CV & lettres.",
    cvLabel: en ? "CV text *" : "Texte du CV *",
    cvPlaceholder: en
      ? "Paste your full resume here…"
      : "Collez ici l'intégralité de votre CV…",
    roleLabel: en ? "Target role (optional)" : "Poste visé (optionnel)",
    rolePlaceholder: en ? "e.g. Full Stack Developer" : "ex. Développeur Full Stack",
    jobLabel: en ? "Job posting (optional)" : "Annonce d'emploi (optionnel)",
    jobPlaceholder: en
      ? "Paste a job description to get job-alignment scoring…"
      : "Collez une annonce pour un score d'alignement avec l'offre…",
    jobHint: en
      ? "With a job posting, the analysis includes keyword match and gaps (like a tailored resume)."
      : "Avec une annonce, l'analyse inclut le matching mots-clés et les écarts (comme un CV sur mesure).",
    existingHint: en
      ? "Analyze a resume you already built on Digimytch, including tailored versions linked to a job."
      : "Analysez un CV déjà créé sur Digimytch, y compris les versions sur mesure liées à une offre.",
    selectCv: en ? "Base resume" : "CV de base",
    selectPlaceholder: en ? "Choose a resume" : "Choisir un CV",
    manageCvs: en ? "Manage CV & letters →" : "Gérer CV & lettres →",
    analyzeBtn: en ? "Analyze my score" : "Analyser mon score",
    analyzing: en ? "Preparing…" : "Préparation…",
    changeSource: en ? "Change source" : "Changer de source",
    resultsTitle: en ? "Your score analysis" : "Votre analyse de score",
    emptyResults: en
      ? "Choose a source above, then run the analysis to see your score here."
      : "Choisissez une source ci-dessus, puis lancez l'analyse pour afficher votre score ici.",
    pickResume: en ? "Select a resume." : "Sélectionnez un CV.",
    ready: en ? "Ready — generate or view your score below." : "Prêt — générez ou consultez votre score ci-dessous.",
    error: en ? "Unable to prepare analysis." : "Impossible de préparer l'analyse.",
    atsTitle: en ? "ATS keyword gap" : "Analyse des écarts ATS",
    atsSubtitle: en
      ? "Keyword coverage by CV section vs. the job posting (target: 60–80%)."
      : "Couverture des mots-clés par section du CV face à l'offre (objectif 60–80 %).",
    atsNeedJob: en
      ? "Paste a job description (40+ characters) to run the ATS gap analysis."
      : "Collez une annonce (40+ caractères) pour lancer l'analyse des écarts ATS.",
    atsOverall: en ? "Overall ATS compatibility" : "Compatibilité ATS globale",
    atsOverallHint: en
      ? "Based on keyword presence in summary, experience, skills and education."
      : "Basé sur la présence des mots-clés dans le résumé, l'expérience, les compétences et la formation.",
    atsSectionSummary: en ? "Summary / target role" : "Résumé / poste visé",
    atsSectionExperience: en ? "Experience" : "Expérience",
    atsSectionSkills: en ? "Skills" : "Compétences",
    atsSectionEducation: en ? "Education" : "Formation",
    atsQuickWinsTitle: en
      ? "Quick wins — add these 3 terms to boost your score"
      : "Gains rapides — ajoutez ces 3 termes pour booster votre score",
    atsQuickWinsHint: en
      ? "Easy additions with high ATS impact."
      : "Ajouts faciles à fort impact ATS.",
    atsCriticalTitle: en ? "Critical missing keywords" : "Mots-clés critiques absents",
    atsCopyBtn: en ? "Copy missing keywords" : "Copier les mots-clés manquants",
    atsCopied: en ? "Keywords copied to clipboard." : "Mots-clés copiés dans le presse-papiers.",
    atsCopyFailed: en ? "Unable to copy." : "Impossible de copier.",
    atsNothingToCopy: en ? "No critical gaps to copy." : "Aucun écart critique à copier.",
    atsAnalyzing: en ? "Analyzing…" : "Analyse ATS…",
    atsRerun: en ? "Re-run ATS analysis" : "Relancer l'analyse ATS",
    atsReady: en ? "ATS gap analysis ready." : "Analyse ATS prête.",
    atsError: en ? "ATS analysis failed." : "Analyse ATS impossible.",
    atsJobTooShort: en
      ? "Job description too short (min. 40 characters)."
      : "Annonce trop courte (min. 40 caractères).",
    existingJobLabel: en ? "Job posting for ATS (optional)" : "Annonce pour l'ATS (optionnel)",
    existingJobPlaceholder: en
      ? "Paste a job description to compare keywords section by section…"
      : "Collez une annonce pour comparer les mots-clés section par section…",
  };
}
