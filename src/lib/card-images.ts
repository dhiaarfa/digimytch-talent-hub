/**
 * Images de cartes — URLs Unsplash (licence libre, usage non commercial OK).
 * Ratio cible 16:9 (~800×450) pour limiter le CLS et garder des vignettes nettes.
 */

import type { Course, Job } from "@/lib/types";

const U = (photoId: string, w = 800, h = 450) =>
  `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** Vignettes formations par thème (mots-clés skills / titre) */
const COURSE_THEMES: { keys: string[]; src: string; label: string }[] = [
  {
    keys: ["react", "javascript", "frontend", "node", "typescript", "fullstack", "full-stack"],
    src: U("1498050108023-c5249f4df085"),
    label: "Développement web",
  },
  {
    keys: ["sql", "postgresql", "database"],
    src: U("1544383835-bda2bc66a55d"),
    label: "Bases de données",
  },
  {
    keys: ["docker", "devops", "ci/cd", "kubernetes", "aws"],
    src: U("1667372393119-3d45c210fb22"),
    label: "DevOps et cloud",
  },
  {
    keys: ["security", "cyber", "rest", "api"],
    src: U("1563986768609-322da13575f3"),
    label: "Sécurité et APIs",
  },
  {
    keys: ["ai", "llm", "prompt", "machine learning", "pytorch", "nlp"],
    src: U("1677442136019-21780ecad995"),
    label: "Intelligence artificielle",
  },
  {
    keys: ["python", "automation", "scripting"],
    src: U("1526379095098-4009ccfad2e0"),
    label: "Python",
  },
  {
    keys: ["communication", "presentation", "english", "french", "writing"],
    src: U("1522071820081-009f0129c71c"),
    label: "Communication",
  },
  {
    keys: ["leadership", "teamwork", "management", "scrum", "agile"],
    src: U("1552664730-d307ca884978"),
    label: "Management",
  },
  {
    keys: ["linkedin", "branding", "networking", "career", "negotiation"],
    src: U("1611224923853-80b023f02d71"),
    label: "Carrière",
  },
  {
    keys: ["productivity", "organization"],
    src: U("1484480974693-6ca158aa584d"),
    label: "Productivité",
  },
  {
    keys: ["figma", "ux", "ui", "design"],
    src: U("1561070791-2526d30994b5"),
    label: "Design UX/UI",
  },
  {
    keys: ["marketing", "seo", "social"],
    src: U("1460925895917-afdab827c52f"),
    label: "Marketing digital",
  },
  {
    keys: ["finance", "accounting", "business"],
    src: U("1486406146926-c627a92fd1b2"),
    label: "Finance",
  },
  {
    keys: ["power bi", "excel", "data analysis", "data"],
    src: U("1551288049-bebda4e38f71"),
    label: "Data & analytics",
  },
  {
    keys: ["entrepreneur", "startup"],
    src: U("1559133485-06e094f38cb5"),
    label: "Entrepreneuriat",
  },
];

/** Offres d'emploi par profil */
const JOB_THEMES: { keys: string[]; src: string; label: string }[] = [
  {
    keys: ["java", "spring", "bank", "fintech", "vermeg", "biat"],
    src: U("1486406146926-c627a92fd1b2"),
    label: "Finance et entreprise",
  },
  {
    keys: ["devops", "kubernetes", "docker", "ci/cd", "aws"],
    src: U("1451187580459-43490279c0fa"),
    label: "Infrastructure",
  },
  {
    keys: ["react", "frontend", "typescript", "redux", "css"],
    src: U("1461747286884-dccba6302f2e"),
    label: "Développement frontend",
  },
  {
    keys: ["scrum", "project", "chef", "agile", "stakeholder"],
    src: U("1552664730-d307ca884978"),
    label: "Gestion de projet",
  },
  {
    keys: ["machine learning", "pytorch", "nlp", "python", "ml"],
    src: U("1677442136019-21780ecad995"),
    label: "Machine learning",
  },
  {
    keys: ["node", "microservice", "kafka", "backend"],
    src: U("1517694716122-02f890a2850a"),
    label: "Backend",
  },
  {
    keys: ["power bi", "excel", "data analysis", "reporting", "analyste"],
    src: U("1551288049-bebda4e38f71"),
    label: "Analyse de données",
  },
  {
    keys: ["stagiaire", "pfe", "next.js", "supabase", "digimytch"],
    src: U("1522071820081-009f0129c71c"),
    label: "Stage et innovation",
  },
];

const DEFAULT_COURSE = {
  src: U("1501504905252-467f863fbef4"),
  label: "Formation professionnelle",
};
const DEFAULT_JOB = {
  src: U("1497366216548-37526070297c"),
  label: "Environnement de travail",
};

/** Titres seed → image fixe (cohérence catalogue démo) */
const COURSE_TITLE_IMAGES: Record<string, string> = {
  "Parcours Full-Stack JavaScript": U("1498050108023-c5249f4df085"),
  "Fondamentaux PostgreSQL & SQL": U("1544383835-bda2bc66a55d"),
  "Docker & déploiement cloud": U("1667372393119-3d45c210fb22"),
  "API REST & sécurité (Node.js)": U("1563986768609-322da13575f3"),
  "Introduction à l’IA générative pour développeurs": U("1677442136019-21780ecad995"),
  "Communication professionnelle & prise de parole": U("1522071820081-009f0129c71c"),
  "Leadership & travail en équipe": U("1552664730-d307ca884978"),
  "Anglais professionnel (B2 → C1)": U("1523247735736-79194c3add91"),
  "Français rédactionnel — CV & entretien": U("1522071820081-009f0129c71c"),
  "Personal branding LinkedIn": U("1611224923853-80b023f02d71"),
  "Gestion du temps & productivité": U("1484480974693-6ca158aa584d"),
  "Négociation salariale (marché tunisien)": U("1556761175-5973dc0f2675"),
  "Design UX/UI — Figma": U("1561070791-2526d30994b5"),
  "Marketing digital & réseaux sociaux": U("1460925895917-afdab827c52f"),
  "Comptabilité & finance pour non-financiers": U("1486406146926-c627a92fd1b2"),
  "Cybersécurité — bonnes pratiques": U("1550751827-4bd374c3f58b"),
  "Data Analyst — Power BI & Excel": U("1551288049-bebda4e38f71"),
  "Entrepreneuriat & création de startup": U("1559133485-06e094f38cb5"),
  "React.js avancé — hooks & performance": U("1633356122544-f134324a6cee"),
  "Python pour l'automatisation": U("1526379095098-4009ccfad2e0"),
};

function normalizeHay(...parts: (string | null | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function pickTheme(
  hay: string,
  themes: { keys: string[]; src: string; label: string }[]
): { src: string; label: string } {
  for (const theme of themes) {
    if (theme.keys.some((k) => hay.includes(k))) {
      return { src: theme.src, label: theme.label };
    }
  }
  return themes === COURSE_THEMES ? DEFAULT_COURSE : DEFAULT_JOB;
}

export type CardImageMeta = { src: string; alt: string };

export function resolveCourseImage(course: Pick<Course, "title" | "skills_targeted" | "image_url">): CardImageMeta {
  if (course.image_url?.trim()) {
    return {
      src: course.image_url.trim(),
      alt: `Illustration : ${course.title}`,
    };
  }
  const titled = COURSE_TITLE_IMAGES[course.title];
  if (titled) {
    return { src: titled, alt: `Illustration : ${course.title}` };
  }
  const hay = normalizeHay(course.title, ...course.skills_targeted);
  const theme = pickTheme(hay, COURSE_THEMES);
  return { src: theme.src, alt: `${theme.label} — ${course.title}` };
}

export function resolveJobImage(
  job: Pick<Job, "position_title" | "company_name" | "keywords" | "image_url" | "work_location">
): CardImageMeta {
  if (job.image_url?.trim()) {
    return {
      src: job.image_url.trim(),
      alt: `Visuel : ${job.position_title} chez ${job.company_name}`,
    };
  }
  const hay = normalizeHay(
    job.position_title,
    job.company_name,
    job.work_location ?? "",
    ...(job.keywords ?? [])
  );
  const theme = pickTheme(hay, JOB_THEMES);
  return {
    src: theme.src,
    alt: `${theme.label} — ${job.position_title}`,
  };
}

/** Pour l'admin : URL suggérée à l'import */
export function suggestCourseImageUrl(
  title: string,
  skills: string[]
): string {
  return resolveCourseImage({
    title,
    skills_targeted: skills,
    image_url: null,
  }).src;
}

export function suggestJobImageUrl(
  positionTitle: string,
  companyName: string,
  keywords: string[]
): string {
  return resolveJobImage({
    position_title: positionTitle,
    company_name: companyName,
    keywords,
    image_url: null,
    work_location: null,
  }).src;
}
