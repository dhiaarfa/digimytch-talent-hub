import type { DigiLang } from "@/lib/use-language";

export function landingCopy(lang: DigiLang) {
  const en = lang === "en";
  return {
    heroTitle1: en ? "Land your" : "Décrochez votre",
    heroTitle2: en ? "next job" : "prochain emploi",
    heroTitle3: en ? "with AI." : "avec l'IA.",
    heroDesc: en
      ? "Digimytch Talent Hub brings your CV, tailored cover letters, job matching, LinkedIn profile tips, training, and application tracking into one place — built for Tunisia and beyond."
      : "Digimytch Talent Hub réunit CV, lettres de motivation, matching d'offres, analyse LinkedIn, formations et suivi de candidatures — pensé pour la Tunisie et l'international.",
    ctaSignup: en ? "Create my free profile" : "Créer mon profil gratuitement",
    ctaHow: en ? "See how it works" : "Voir comment ça marche",
    heroBullets: en
      ? "CV & AI cover letters | Job match score 0–100 | LinkedIn screenshot analysis | Applications & interviews"
      : "CV & lettres IA | Score matching 0-100 | Analyse LinkedIn | Candidatures & entretiens",

    howTitle: en ? "In 5 simple steps" : "En 5 étapes simples",
    howSub: en
      ? "From profile to tailored application — CV, letter, and tracking in one flow"
      : "Du profil à la candidature complète — CV, lettre et suivi dans un seul parcours",

    featuresTitle: en
      ? "Everything for your job search"
      : "Tout pour votre recherche d'emploi",

    steps: en
      ? [
          {
            n: "01",
            title: "Create your account",
            desc: "Free signup in seconds. Email or GitHub — no credit card.",
          },
          {
            n: "02",
            title: "Build your CV",
            desc: "Base CV, import PDF/Word, or AI structuring. Tailored versions per job offer.",
          },
          {
            n: "03",
            title: "Analyze job offers",
            desc: "Paste a posting (LinkedIn, Rekrute, Indeed…). Get your 0–100 match score and skill gaps.",
          },
          {
            n: "04",
            title: "Cover letter ready",
            desc: "Letters are generated from your CV and the offer, with live preview and AI improvements.",
          },
          {
            n: "05",
            title: "Apply & prepare",
            desc: "Kanban for applications, recommended training, LinkedIn tips, and interview simulator.",
          },
        ]
      : [
          {
            n: "01",
            title: "Créez votre compte",
            desc: "Inscription gratuite en quelques secondes. Email ou GitHub — sans carte bancaire.",
          },
          {
            n: "02",
            title: "Construisez votre CV",
            desc: "CV de base, import PDF/Word ou structuration IA. Versions sur mesure par offre.",
          },
          {
            n: "03",
            title: "Analysez vos offres",
            desc: "Collez une annonce (LinkedIn, Rekrute, Indeed…). Score de compatibilité 0-100 et écarts de compétences.",
          },
          {
            n: "04",
            title: "Lettre de motivation",
            desc: "Génération automatique à partir du CV et de l'offre, aperçu en direct et amélioration IA.",
          },
          {
            n: "05",
            title: "Postulez & préparez-vous",
            desc: "Kanban candidatures, formations recommandées, analyse LinkedIn et simulateur d'entretien.",
          },
        ],

    features: en
      ? [
          {
            title: "CV & cover letters",
            desc: "One hub for base and tailored CVs, plus motivation letters linked to each offer — with live preview.",
          },
          {
            title: "Score Bridge",
            desc: "0–100 compatibility with recognized and missing skills for every analyzed posting.",
          },
          {
            title: "AI cover letters",
            desc: "Automatic draft from your CV and the job. Edit, improve with AI, save — no separate workflow.",
          },
          {
            title: "LinkedIn analysis",
            desc: "Upload a profile screenshot. Get a score, strengths, weaknesses, and actionable recommendations.",
          },
          {
            title: "Targeted training",
            desc: "Digimytch catalog aligned with skill gaps detected on your analyzed offers.",
          },
          {
            title: "Applications & interviews",
            desc: "Pipeline wishlist → applied → interview → offer, plus AI interview practice.",
          },
        ]
      : [
          {
            title: "CV & lettres",
            desc: "Un espace unique pour CV de base, CV sur mesure et lettres liées à chaque offre — avec aperçu en direct.",
          },
          {
            title: "Score Bridge",
            desc: "Compatibilité 0-100 avec compétences reconnues et manquantes pour chaque annonce analysée.",
          },
          {
            title: "Lettres IA",
            desc: "Brouillon automatique à partir du CV et de l'offre. Édition, amélioration IA et enregistrement intégrés.",
          },
          {
            title: "Analyse LinkedIn",
            desc: "Importez une capture d'écran de profil. Score, forces, faiblesses et recommandations concrètes.",
          },
          {
            title: "Formations ciblées",
            desc: "Catalogue Digimytch aligné sur les écarts détectés sur vos offres analysées.",
          },
          {
            title: "Candidatures & entretiens",
            desc: "Pipeline wishlist → postulé → entretien → offre, plus simulateur d'entretien IA.",
          },
        ],

    scoreTitle: en
      ? "See exactly why you match — or not."
      : "Comprenez exactement pourquoi vous matchez — ou non.",
    scoreSub: en
      ? "Our algorithm breaks down each offer and compares it to your base CV."
      : "Notre algorithme décompose chaque offre et la compare à votre CV de référence.",
    scoreCompatLabel: en ? "Offer compatibility" : "Compatibilité avec l'offre",
    scoreMatched: en ? "Recognized skills" : "Compétences reconnues",
    scoreMissing: en ? "Missing skills" : "Compétences manquantes",
    scoreTip: en
      ? "💡 You're missing Docker. "
      : "💡 Il vous manque Docker. ",
    scoreTipLink: en ? "See training →" : "Voir la formation →",
    scoreCta: en ? "Try with my profile" : "Essayer avec mon profil",

    testimonialsTitle: en
      ? "They structure their search with Digimytch"
      : "Ils structurent leur recherche avec Digimytch",
    testimonials: en
      ? [
          {
            initials: "A.K.",
            name: "Aziz K.",
            role: "Full Stack Developer — Tunis",
            quote:
              "I analyzed 8 offers in one week. The match score showed I was missing Docker. I took the recommended course and landed the interview.",
            bg: "var(--digi-navy)",
          },
          {
            initials: "M.B.",
            name: "Mariem B.",
            role: "Project Manager — Sfax",
            quote:
              "The cover letter is generated from my CV and the offer — I see the result live on the right. Huge time saver.",
            bg: "var(--digi-accent)",
          },
          {
            initials: "S.R.",
            name: "Sami R.",
            role: "ENSI Student — Internship search",
            quote:
              "Application tracking and the interview simulator are exactly what I needed. No more Excel spreadsheets.",
            bg: "var(--digi-orange)",
          },
        ]
      : [
          {
            initials: "A.K.",
            name: "Aziz K.",
            role: "Développeur Full Stack — Tunis",
            quote:
              "J'ai analysé 8 offres en une semaine. Le score m'a montré que je manquais de Docker. Formation recommandée, puis entretien décroché.",
            bg: "var(--digi-navy)",
          },
          {
            initials: "M.B.",
            name: "Mariem B.",
            role: "Chef de projet — Sfax",
            quote:
              "La lettre se génère à partir de mon CV et de l'offre — je la vois en direct à droite. Un vrai gain de temps.",
            bg: "var(--digi-accent)",
          },
          {
            initials: "S.R.",
            name: "Sami R.",
            role: "Étudiant ENSI — Alternance",
            quote:
              "Le suivi des candidatures et le simulateur d'entretien, c'est exactement ce qu'il me fallait. Fini le tableur Excel.",
            bg: "var(--digi-orange)",
          },
        ],

    faqTitle: en ? "Frequently asked questions" : "Questions fréquentes",
    faqItems: en
      ? [
          {
            q: "How does the match score work?",
            a: "The 0–100 score compares your base CV to keywords, job title, and expected skills for each pasted offer.",
          },
          {
            q: "How do cover letters work?",
            a: "Each tailored CV can be linked to a job offer. The letter is generated automatically from your CV and the offer, with live preview and AI editing.",
          },
          {
            q: "What is LinkedIn analysis?",
            a: "Upload a screenshot of your LinkedIn profile. AI returns a score, strengths, weaknesses, and improvement tips (free-tier models may rate-limit at peak times).",
          },
          {
            q: "Do trainings come from the internet?",
            a: "No. The catalog is managed by Digimytch and aligned with skill gaps from your analyzed offers.",
          },
          {
            q: "Can I track my applications?",
            a: "Yes. Kanban with statuses, history, and notes — plus an interview preparation module.",
          },
          {
            q: "Does the AI write in French?",
            a: "Yes. Professional French for CV and letters, with optional API keys if you prefer your own provider.",
          },
          {
            q: "Is my data protected?",
            a: "Your data is stored securely. You control what you share in your profile.",
          },
          {
            q: "Is it free?",
            a: "100% free for candidates in this demo. No credit card or subscription required.",
          },
          {
            q: "Can I analyze Rekrute or LinkedIn job posts?",
            a: "Paste the job text from LinkedIn, Rekrute, Indeed, or any site to get your score and tailor your CV.",
          },
          {
            q: "Do I need a base CV?",
            a: "Yes. Matching and tailored CVs use your base CV as reference.",
          },
        ]
      : [
          {
            q: "Comment fonctionne le score de matching ?",
            a: "Le score (0 à 100) compare votre CV de base aux mots-clés, au titre du poste et aux compétences attendues pour chaque offre collée.",
          },
          {
            q: "Comment fonctionnent les lettres de motivation ?",
            a: "Chaque CV sur mesure est lié à une offre. La lettre est générée automatiquement à partir du CV et de l'annonce, avec aperçu en direct et amélioration IA.",
          },
          {
            q: "Qu'est-ce que l'analyse LinkedIn ?",
            a: "Importez une capture d'écran de votre profil. L'IA renvoie un score, des forces, des faiblesses et des conseils (les modèles gratuits peuvent être limités aux heures de pointe).",
          },
          {
            q: "Les formations viennent-elles d'Internet ?",
            a: "Non. Le catalogue est géré par Digimytch et aligné sur vos écarts de compétences.",
          },
          {
            q: "Puis-je suivre mes candidatures ?",
            a: "Oui. Tableau Kanban avec statuts, historique, notes — et module de préparation aux entretiens.",
          },
          {
            q: "L'assistant IA rédige-t-il en français ?",
            a: "Oui. CV et lettres en français professionnel, avec vos clés API si vous le souhaitez.",
          },
          {
            q: "Mes données sont-elles protégées ?",
            a: "Vos données sont hébergées de manière sécurisée. Vous contrôlez ce que vous partagez.",
          },
          {
            q: "Est-ce gratuit ?",
            a: "100 % gratuit pour les candidats dans cette démo. Sans carte bancaire ni abonnement.",
          },
          {
            q: "Puis-je analyser des offres Rekrute ou LinkedIn ?",
            a: "Collez le texte de l'offre depuis LinkedIn, Rekrute, Indeed ou tout autre site pour obtenir votre score et adapter votre CV.",
          },
          {
            q: "Faut-il un CV de base ?",
            a: "Oui. Le matching et les CV sur mesure s'appuient sur votre CV de base.",
          },
        ],

    ctaFinalTitle: en ? "Ready to boost your job search?" : "Prêt à booster votre recherche ?",
    ctaFinalDesc: en
      ? "Create a free account and explore CV & letters, job matching, LinkedIn analysis, training, and applications."
      : "Créez un compte gratuit et explorez CV & lettres, matching, analyse LinkedIn, formations et candidatures.",
    ctaFinalBtn: en ? "Start for free" : "Commencer gratuitement",
    ctaFinalNote: en
      ? "Academic demo — Tunisian job market focus"
      : "Démo académique — marché de l'emploi tunisien",

    trustBanner: en
      ? "Academic PFE project · Local data · Demo environment"
      : "Projet PFE académique · Données locales · Environnement de démonstration",
  };
}
