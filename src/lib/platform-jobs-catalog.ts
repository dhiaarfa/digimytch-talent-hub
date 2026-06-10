/** Offres modèles Digimytch — catalogue à adopter (distinct des offres externes collées par l'utilisateur). */
export interface PlatformJobTemplate {
  slug: string;
  company_name: string;
  position_title: string;
  location: string;
  keywords: string[];
  description: string;
}

export const PLATFORM_JOB_CATALOG: PlatformJobTemplate[] = [
  {
    slug: "vermeg-fullstack",
    company_name: "Vermeg",
    position_title: "Développeur Full Stack Java / React",
    location: "Tunis",
    keywords: ["java", "react", "spring", "sql", "rest", "agile"],
    description: "Développement d'applications bancaires. Stack Java, Spring Boot, React. 2+ ans d'expérience.",
  },
  {
    slug: "focus-devops",
    company_name: "Focus Corporation",
    position_title: "Ingénieur DevOps",
    location: "Sousse",
    keywords: ["docker", "kubernetes", "ci/cd", "aws", "linux"],
    description: "Pipeline CI/CD, conteneurisation, monitoring. Profil autonome.",
  },
  {
    slug: "expensya-frontend",
    company_name: "Expensya",
    position_title: "Développeur Frontend React",
    location: "Tunis — Hybride",
    keywords: ["react", "typescript", "redux", "css", "jest"],
    description: "SaaS fintech. Équipe produit internationale, code review, tests.",
  },
  {
    slug: "orange-chef-projet",
    company_name: "Orange Tunisie",
    position_title: "Chef de projet digital",
    location: "Tunis",
    keywords: ["scrum", "agile", "communication", "gestion de projet", "stakeholders"],
    description: "Pilotage de projets web et mobile. Coordination équipes techniques et métier.",
  },
  {
    slug: "instadeep-ml",
    company_name: "InstaDeep",
    position_title: "Machine Learning Engineer",
    location: "Tunis",
    keywords: ["python", "pytorch", "machine learning", "nlp", "docker"],
    description: "Modèles IA en production. Recherche appliquée, MLOps.",
  },
  {
    slug: "talabat-backend",
    company_name: "Talabat (Delivery Hero)",
    position_title: "Backend Developer Node.js",
    location: "Remote — Tunisie",
    keywords: ["node.js", "typescript", "postgresql", "microservices", "kafka"],
    description: "Microservices haute charge. Architecture event-driven.",
  },
  {
    slug: "biat-data",
    company_name: "BIAT",
    position_title: "Analyste données junior",
    location: "Tunis",
    keywords: ["sql", "power bi", "excel", "analyse de données", "reporting"],
    description: "Tableaux de bord, reporting réglementaire, collaboration avec la DSI.",
  },
  {
    slug: "digimytch-pfe",
    company_name: "Digimytch",
    position_title: "Stagiaire PFE — Talent Hub",
    location: "Tunis",
    keywords: ["next.js", "react", "typescript", "supabase", "ia"],
    description: "Prototype plateforme carrière. Stack moderne, encadrement PFE.",
  },
  {
    slug: "societe-generale-java",
    company_name: "Société Générale",
    position_title: "Développeur Java confirmé",
    location: "Tunis",
    keywords: ["java", "spring boot", "microservices", "sql", "kafka"],
    description: "Services bancaires digitaux. Équipe agile, forte exigence qualité.",
  },
  {
    slug: "beekeeper-mobile",
    company_name: "Beekeeper",
    position_title: "Développeur mobile Flutter",
    location: "Remote — Tunisie",
    keywords: ["flutter", "dart", "mobile", "rest", "firebase"],
    description: "Application mobile B2B. Releases fréquentes, CI/CD mobile.",
  },
  {
    slug: "proxym-group-qa",
    company_name: "Proxym Group",
    position_title: "Ingénieur QA / Test automation",
    location: "Tunis",
    keywords: ["selenium", "cypress", "automation", "agile", "api testing"],
    description: "Automatisation des tests web et API. Collaboration étroite avec les devs.",
  },
  {
    slug: "wally-data",
    company_name: "Wally",
    position_title: "Data Engineer",
    location: "Tunis — Hybride",
    keywords: ["python", "sql", "etl", "airflow", "aws", "spark"],
    description: "Pipelines data, entrepôts cloud, gouvernance des données.",
  },
  {
    slug: "stark-industries-product",
    company_name: "Stark Industries",
    position_title: "Product Owner junior",
    location: "Sfax",
    keywords: ["product", "agile", "scrum", "user stories", "communication"],
    description: "Backlog produit, priorisation, lien métier / technique.",
  },
  {
    slug: "cloudflare-sre",
    company_name: "Cloudflare (partenaire)",
    position_title: "Site Reliability Engineer",
    location: "Remote",
    keywords: ["linux", "networking", "monitoring", "incident", "automation"],
    description: "Disponibilité des services, observabilité, réponse aux incidents.",
  },
  {
    slug: "ooredoo-crm",
    company_name: "Ooredoo Tunisie",
    position_title: "Consultant CRM Salesforce",
    location: "Tunis",
    keywords: ["salesforce", "crm", "apex", "integration", "agile"],
    description: "Implémentation CRM, intégrations, accompagnement utilisateurs.",
  },
  {
    slug: "dept-ux",
    company_name: "DEPT®",
    position_title: "UX/UI Designer",
    location: "Tunis — Hybride",
    keywords: ["figma", "ux", "ui", "design system", "prototypage"],
    description: "Conception d'interfaces web, tests utilisateurs, design systems.",
  },
];
