import type { DigiLang } from "@/lib/use-language";

export function landingCopy(lang: DigiLang) {
  const en = lang === "en";
  return {
    heroTitle1: en ? "Land your" : "Décrochez votre",
    heroTitle2: en ? "next job" : "prochain emploi",
    heroTitle3: en ? "with AI." : "avec l'IA.",
    heroDesc: en
      ? "Digimytch Talent Hub analyzes your profile, scores job offers, and guides applications — in French and English, for Tunisia and beyond."
      : "Digimytch Talent Hub analyse votre profil, évalue vos offres et guide vos candidatures — en français, pour le marché tunisien et international.",
    ctaSignup: en ? "Create my free profile" : "Créer mon profil gratuitement",
    ctaHow: en ? "See how it works" : "Voir comment ça marche",
    heroBullets: en
      ? "AI-optimized CV | Matching score 0–100 | Full application tracking"
      : "CV optimisé par IA | Score de matching 0-100 | Suivi complet des candidatures",
    howTitle: en ? "In 4 simple steps" : "En 4 étapes simples",
    howSub: en
      ? "From zero to structured candidate in under an hour"
      : "De zéro à candidat structuré en moins d'une heure",
    featuresTitle: en
      ? "Everything for your job search"
      : "Tout pour votre recherche d'emploi",
    steps: en
      ? [
          { n: "01", title: "Create your account", desc: "Free signup in 30 seconds. Email or GitHub." },
          { n: "02", title: "Build your resume", desc: "Add experience and skills. AI suggests professional wording." },
          { n: "03", title: "Analyze job offers", desc: "Paste a posting. Get your match score and recommended training." },
          { n: "04", title: "Track applications", desc: "Statuses, history, notes — all in one clear dashboard." },
        ]
      : [
          { n: "01", title: "Créez votre compte", desc: "Inscription gratuite en 30 secondes. Email ou GitHub." },
          { n: "02", title: "Construisez votre CV", desc: "Remplissez vos expériences et compétences. L'IA suggère des reformulations professionnelles." },
          { n: "03", title: "Analysez vos offres", desc: "Collez une offre d'emploi. Obtenez votre score de compatibilité et les formations recommandées." },
          { n: "04", title: "Suivez vos candidatures", desc: "Statuts, historique, notes. Tout centralisé dans un tableau de bord clair." },
        ],
    features: en
      ? [
          { title: "Smart resume", desc: "AI assistant to structure and polish your profile in professional French." },
          { title: "Score Bridge", desc: "0–100 compatibility with matched and missing skills." },
          { title: "Targeted training", desc: "Digimytch catalog aligned with gaps from your analyzed offers." },
          { title: "Application pipeline", desc: "Kanban wishlist → applied → interview → offer, with history." },
        ]
      : [
          { title: "CV intelligent", desc: "Assistant IA pour structurer et reformuler votre parcours en français professionnel." },
          { title: "Score Bridge", desc: "Compatibilité 0-100 avec détail des compétences reconnues et manquantes." },
          { title: "Formations ciblées", desc: "Catalogue Digimytch aligné sur vos écarts détectés sur vos offres." },
          { title: "Pipeline candidatures", desc: "Kanban wishlist → postulé → entretien → offre, avec historique." },
        ],
    faqTitle: en ? "Frequently asked questions" : "Questions fréquentes",
    ctaFinalTitle: en ? "Ready to boost your job search?" : "Prêt à booster votre recherche ?",
    ctaFinalBtn: en ? "Start for free" : "Commencer gratuitement",
  };
}
