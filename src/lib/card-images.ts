/**
 * Card image resolution — Unsplash CDN + smart category-based fallback.
 *
 * Image URLs use Unsplash's public CDN with stable photo IDs (HTTP-verified).
 * If an image fails to load in the browser, EntityCardImage shows a
 * branded gradient + icon fallback that matches the category.
 */

import type { Course, Job } from "@/lib/types";
import { PLATFORM_JOB_CATALOG } from "@/lib/platform-jobs-catalog";

const U = (photoId: string, w = 800, h = 450) =>
  `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** Curated Unsplash library — each ID verified reachable (HTTP 200). */
const P = {
  codingLaptop: U("1498050108023-c5249f4df085"),
  codingScreen: U("1555066931-4365d14bab8c"),
  codingMonitor: U("1504639725590-34d0984388bd"),
  database: U("1544383835-bda2bc66a55d"),
  serverRoom: U("1558494949-ef010cbdcc31"),
  cloudInfra: U("1451187580459-43490279c0fa"),
  security: U("1614064641938-3bbee52942c7"),
  cyber: U("1550751827-4bd374c3f58b"),
  cyberAwareness: U("1563986768609-322da13575f3"),
  ai: U("1677442136019-21780ecad995"),
  python: U("1515879218367-8466d910aaa4"),
  presentation: U("1552581234-26160f608093"),
  meeting: U("1556761175-5973dc0f32e7"),
  teamLeadership: U("1542744173-8e7e53415bb0"),
  teamCollab: U("1522071820081-009f0129c71c"),
  professional: U("1573496359142-b8d87734a5a2"),
  writing: U("1503676260728-1c00da094a0b"),
  design: U("1561070791-2526d30994b5"),
  marketing: U("1432888498266-38ffec3eaf0a"),
  finance: U("1611974789855-9c2a0a7236a3"),
  banking: U("1554224155-6726b3ff858f"),
  analytics: U("1551288049-bebda4e38f71"),
  analyticsCharts: U("1460925895917-afdab827c52f"),
  agile: U("1552664730-d307ca884978"),
  productivity: U("1454165804606-c3d57bc86b40"),
  handshake: U("1521791136064-7986c2920216"),
  interview: U("1600880292203-757bb62b4baf"),
  resume: U("1560250097-0b93528c311a"),
  startup: U("1522202176988-66273c2fd55f"),
  frontendUi: U("1593642632559-0c6d3fc62b89"),
  mobile: U("1512941937669-90a1b58e7e9c"),
  mobileDev: U("1595675024853-0f3ec9098ac7"),
  csEducation: U("1516321318423-f06f85e504b3"),
  remoteCloud: U("1553877522-43269d4ea984"),
  officeJob: U("1497366216548-37526070297c"),
} as const;

const DEFAULT_COURSE = { src: P.codingLaptop, label: "Formation professionnelle" };
const DEFAULT_JOB = { src: P.officeJob, label: "Opportunité d'emploi" };

// ── Course images by theme (fallback when no pinned title) ─────────────────────
const COURSE_THEMES: { keys: string[]; src: string; label: string }[] = [
  {
    keys: ["react", "javascript", "frontend", "next.js", "typescript", "fullstack", "full-stack", "html", "css", "vue", "angular"],
    src: P.codingLaptop,
    label: "Développement web",
  },
  {
    keys: ["sql", "postgresql", "database", "mysql", "mongodb", "nosql"],
    src: P.database,
    label: "Bases de données",
  },
  {
    keys: ["docker", "devops", "ci/cd", "kubernetes", "aws", "linux", "cloud", "azure"],
    src: P.serverRoom,
    label: "DevOps & Cloud",
  },
  {
    keys: ["security", "cyber", "cybersecurity", "oauth", "https", "api security"],
    src: P.security,
    label: "Sécurité & APIs",
  },
  {
    keys: ["ai", "llm", "prompt", "machine learning", "deep learning", "pytorch", "nlp", "openai"],
    src: P.ai,
    label: "Intelligence artificielle",
  },
  {
    keys: ["python", "automation", "scripting", "django", "flask", "fastapi"],
    src: P.python,
    label: "Python",
  },
  {
    keys: ["communication", "presentation", "speaking", "interview"],
    src: P.presentation,
    label: "Communication",
  },
  {
    keys: ["english", "anglais", "language", "french", "langue", "writing"],
    src: P.writing,
    label: "Langues",
  },
  {
    keys: ["leadership", "teamwork", "management", "scrum", "agile", "manager"],
    src: P.teamLeadership,
    label: "Management",
  },
  {
    keys: ["linkedin", "branding", "networking", "career", "negotiation", "salaire", "emploi", "job search", "cv", "resume", "ats"],
    src: P.professional,
    label: "Carrière",
  },
  {
    keys: ["productivity", "organization", "gestion du temps", "time"],
    src: P.productivity,
    label: "Productivité",
  },
  {
    keys: ["figma", "ux", "ui", "design", "interface", "prototype"],
    src: P.design,
    label: "Design UX/UI",
  },
  {
    keys: ["marketing", "seo", "social", "digital", "content", "ads", "analytics"],
    src: P.marketing,
    label: "Marketing digital",
  },
  {
    keys: ["finance", "accounting", "comptabilité", "business", "investissement"],
    src: P.finance,
    label: "Finance",
  },
  {
    keys: ["power bi", "excel", "data analysis", "data", "tableau", "statistiques"],
    src: P.analytics,
    label: "Data & Analytics",
  },
  {
    keys: ["entrepreneur", "startup", "innovation", "business plan"],
    src: P.startup,
    label: "Entrepreneuriat",
  },
  {
    keys: ["programming", "algorithms", "computer science", "c++", "c language"],
    src: P.csEducation,
    label: "Informatique",
  },
];

// ── Job images by domain (fallback) ───────────────────────────────────────────
const JOB_THEMES: { keys: string[]; src: string; label: string }[] = [
  {
    keys: ["flutter", "dart", "mobile", "ios", "android"],
    src: P.mobileDev,
    label: "Développement mobile",
  },
  {
    keys: ["qa", "test automation", "selenium", "cypress", "quality assurance"],
    src: P.analyticsCharts,
    label: "QA & Tests",
  },
  {
    keys: ["salesforce", "crm", "apex"],
    src: P.meeting,
    label: "CRM & Salesforce",
  },
  {
    keys: ["product owner", "product manager", "product"],
    src: P.interview,
    label: "Product Management",
  },
  {
    keys: ["data engineer", "etl", "airflow", "spark", "pipeline"],
    src: P.serverRoom,
    label: "Data Engineering",
  },
  {
    keys: ["frontend", "react", "css", "vue", "angular", "interface"],
    src: P.frontendUi,
    label: "Développement frontend",
  },
  {
    keys: ["backend", "node", "java", "spring", "microservice", "kafka"],
    src: P.codingScreen,
    label: "Développement backend",
  },
  {
    keys: ["devops", "kubernetes", "docker", "ci/cd", "aws", "infrastructure", "sre", "reliability"],
    src: P.cloudInfra,
    label: "DevOps & Cloud",
  },
  {
    keys: ["data", "power bi", "excel", "analyst", "analyste", "reporting", "bi"],
    src: P.analytics,
    label: "Analyse de données",
  },
  {
    keys: ["machine learning", "deep learning", "pytorch", "nlp", "ml engineer"],
    src: P.ai,
    label: "IA & Machine Learning",
  },
  {
    keys: ["scrum", "project", "chef de projet", "agile", "stakeholder", "pmo"],
    src: P.agile,
    label: "Gestion de projet",
  },
  {
    keys: ["security", "cyber", "sécurité", "soc", "pentester"],
    src: P.cyber,
    label: "Cybersécurité",
  },
  {
    keys: ["finance", "bank", "fintech", "comptable", "audit", "biat", "vermeg", "société générale"],
    src: P.banking,
    label: "Finance & Banque",
  },
  {
    keys: ["stagiaire", "pfe", "stage", "digimytch", "junior", "intern"],
    src: P.startup,
    label: "Stage & PFE",
  },
  {
    keys: ["marketing", "seo", "digital", "content", "community"],
    src: P.marketing,
    label: "Marketing digital",
  },
  {
    keys: ["designer", "figma", "ux", "ui", "creative", "graphique"],
    src: P.design,
    label: "Design UX/UI",
  },
  {
    keys: ["support", "helpdesk", "technicien", "maintenance", "réseau", "network", "monitoring"],
    src: P.serverRoom,
    label: "Support IT",
  },
];

// ── Pinned title → image (catalogue seed / démo) ─────────────────────────────
const COURSE_TITLE_IMAGES: Record<string, string> = {
  "Parcours Full-Stack JavaScript": P.codingLaptop,
  "Fondamentaux PostgreSQL & SQL": P.database,
  "Docker & déploiement cloud": P.serverRoom,
  "API REST & sécurité (Node.js)": P.security,
  "Introduction à l'IA générative pour développeurs": P.ai,
  "Introduction à l\u2019IA générative pour développeurs": P.ai,
  "Scrum & gestion de projet agile": P.agile,
  "Communication professionnelle & prise de parole": P.presentation,
  "Leadership & travail en équipe": P.teamCollab,
  "Anglais professionnel (B2 → C1)": P.writing,
  "Français rédactionnel — CV & entretien": P.meeting,
  "Personal branding LinkedIn": P.professional,
  "Gestion du temps & productivité": P.productivity,
  "Négociation salariale (marché tunisien)": P.handshake,
  "Design UX/UI — Figma": P.design,
  "Marketing digital & réseaux sociaux": P.marketing,
  "Comptabilité & finance pour non-financiers": P.finance,
  "Cybersécurité — bonnes pratiques": P.cyberAwareness,
  "Data Analyst — Power BI & Excel": P.analytics,
  "Entrepreneuriat & création de startup": P.startup,
  "React.js avancé — hooks & performance": P.frontendUi,
  "Python pour l'automatisation": P.python,
  "Python pour l\u2019automatisation": P.python,
  "Préparer son entretien d'embauche avec l'IA": P.interview,
  "Préparer son entretien d\u2019embauche avec l\u2019IA": P.interview,
  "Optimiser son CV pour les ATS": P.resume,
  "Introduction au marché de l'emploi tunisien": P.professional,
  "Introduction au marché de l\u2019emploi tunisien": P.professional,
  "Google Analytics 4 — Formation officielle": P.analyticsCharts,
  "AWS Cloud Practitioner Essentials": P.cloudInfra,
  "Microsoft Azure Fundamentals (AZ-900)": P.remoteCloud,
  "Machine Learning Specialization": P.codingMonitor,
  "CS50: Introduction to Computer Science": P.csEducation,
  "Meta Front-End Developer Certificate": P.codingMonitor,
};

const JOB_TITLE_IMAGES: Record<string, string> = Object.fromEntries(
  PLATFORM_JOB_CATALOG.map((j) => {
    const bySlug: Record<string, string> = {
      "vermeg-fullstack": P.banking,
      "focus-devops": P.serverRoom,
      "expensya-frontend": P.frontendUi,
      "orange-chef-projet": P.agile,
      "instadeep-ml": P.ai,
      "talabat-backend": P.codingScreen,
      "biat-data": P.analytics,
      "digimytch-pfe": P.startup,
      "societe-generale-java": P.codingScreen,
      "beekeeper-mobile": P.mobile,
      "proxym-group-qa": P.analyticsCharts,
      "wally-data": P.database,
      "stark-industries-product": P.interview,
      "cloudflare-sre": P.cloudInfra,
      "ooredoo-crm": P.meeting,
      "dept-ux": P.design,
    };
    return [j.position_title, bySlug[j.slug] ?? DEFAULT_JOB.src];
  })
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizeHay(...parts: (string | null | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`´\u2019]/g, "'");
}

function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

function lookupPinnedTitle<T extends Record<string, string>>(
  map: T,
  title: string
): string | undefined {
  const normalized = normalizeTitle(title);
  if (map[normalized]) return map[normalized];
  const hay = normalizeHay(title);
  for (const [key, url] of Object.entries(map)) {
    if (normalizeHay(key) === hay) return url;
  }
  return undefined;
}

function pickTheme(hay: string, themes: { keys: string[]; src: string; label: string }[]) {
  for (const theme of themes) {
    if (theme.keys.some((k) => hay.includes(k))) return theme;
  }
  return themes === COURSE_THEMES ? DEFAULT_COURSE : DEFAULT_JOB;
}

export type CardImageMeta = { src: string; alt: string; categoryHint: string };

export function resolveCourseImage(
  course: Pick<Course, "title" | "skills_targeted" | "image_url">
): CardImageMeta {
  if (course.image_url?.trim()) {
    return {
      src: course.image_url.trim(),
      alt: `Illustration : ${course.title}`,
      categoryHint: normalizeHay(course.title, ...course.skills_targeted),
    };
  }
  const pinned = lookupPinnedTitle(COURSE_TITLE_IMAGES, course.title);
  if (pinned) {
    return {
      src: pinned,
      alt: `Illustration : ${course.title}`,
      categoryHint: normalizeHay(course.title, ...course.skills_targeted),
    };
  }
  const hay = normalizeHay(course.title, ...course.skills_targeted);
  const theme = pickTheme(hay, COURSE_THEMES);
  return { src: theme.src, alt: `${theme.label} — ${course.title}`, categoryHint: hay };
}

export function resolveJobImage(
  job: Pick<Job, "position_title" | "company_name" | "keywords" | "image_url" | "work_location">
): CardImageMeta {
  if (job.image_url?.trim()) {
    return {
      src: job.image_url.trim(),
      alt: `Visuel : ${job.position_title} chez ${job.company_name}`,
      categoryHint: normalizeHay(job.position_title, job.company_name),
    };
  }
  const pinned = lookupPinnedTitle(JOB_TITLE_IMAGES, job.position_title);
  if (pinned) {
    return {
      src: pinned,
      alt: `Visuel : ${job.position_title} chez ${job.company_name}`,
      categoryHint: normalizeHay(job.position_title, job.company_name),
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
    categoryHint: hay,
  };
}

export function suggestCourseImageUrl(title: string, skills: string[]): string {
  return resolveCourseImage({ title, skills_targeted: skills, image_url: null }).src;
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

/** All pinned course titles (for migrations / backfill scripts). */
export function listPinnedCourseImageUrls(): { title: string; image_url: string }[] {
  const seen = new Set<string>();
  return Object.entries(COURSE_TITLE_IMAGES)
    .filter(([title]) => {
      const key = normalizeHay(title);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(([title, image_url]) => ({ title, image_url }));
}

/** All platform job titles with suggested images. */
export function listPinnedJobImageUrls(): { position_title: string; company_name: string; image_url: string }[] {
  return PLATFORM_JOB_CATALOG.map((j) => ({
    position_title: j.position_title,
    company_name: j.company_name,
    image_url: suggestJobImageUrl(j.position_title, j.company_name, [...j.keywords]),
  }));
}
