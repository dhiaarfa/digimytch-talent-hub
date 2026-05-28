"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { suggestJobImageUrl } from "@/lib/card-images";

const DEMO_JOBS = [
  {
    company_name: "Vermeg",
    position_title: "Développeur Full Stack Java / React",
    location: "Tunis",
    keywords: ["java", "react", "spring", "sql", "rest", "agile"],
    description:
      "Développement d'applications bancaires. Stack Java, Spring Boot, React. 2+ ans d'expérience.",
  },
  {
    company_name: "Focus Corporation",
    position_title: "Ingénieur DevOps",
    location: "Sousse",
    keywords: ["docker", "kubernetes", "ci/cd", "aws", "linux"],
    description: "Pipeline CI/CD, conteneurisation, monitoring. Profil autonome.",
  },
  {
    company_name: "Expensya",
    position_title: "Développeur Frontend React",
    location: "Tunis — Hybride",
    keywords: ["react", "typescript", "redux", "css", "jest"],
    description: "SaaS fintech. Équipe produit internationale, code review, tests.",
  },
  {
    company_name: "Orange Tunisie",
    position_title: "Chef de projet digital",
    location: "Tunis",
    keywords: ["scrum", "agile", "communication", "project management", "stakeholders"],
    description: "Pilotage de projets web et mobile. Coordination équipes techniques et métier.",
  },
  {
    company_name: "InstaDeep",
    position_title: "Machine Learning Engineer",
    location: "Tunis",
    keywords: ["python", "pytorch", "machine learning", "nlp", "docker"],
    description: "Modèles IA en production. Recherche appliquée, MLOps.",
  },
  {
    company_name: "Talabat (Delivery Hero)",
    position_title: "Backend Developer Node.js",
    location: "Remote — Tunisie",
    keywords: ["node.js", "typescript", "postgresql", "microservices", "kafka"],
    description: "Microservices haute charge. Event-driven architecture.",
  },
  {
    company_name: "BIAT",
    position_title: "Analyste données junior",
    location: "Tunis",
    keywords: ["sql", "power bi", "excel", "data analysis", "reporting"],
    description: "Tableaux de bord, reporting réglementaire, collaboration avec la DSI.",
  },
  {
    company_name: "Digimytch",
    position_title: "Stagiaire PFE — Talent Hub",
    location: "Tunis",
    keywords: ["next.js", "react", "typescript", "supabase", "ai"],
    description: "Prototype plateforme carrière. Stack moderne, encadrement PFE.",
  },
] as const;

/** Insère des offres démo si l'utilisateur n'en a aucune (démo PFE). */
export async function ensureDemoJobsIfEmpty(): Promise<{ seeded: number }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Non authentifié");

  const { count, error: countErr } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countErr) throw new Error("Impossible de vérifier vos offres.");
  if ((count ?? 0) > 0) return { seeded: 0 };

  const rows = DEMO_JOBS.map((j) => ({
    user_id: user.id,
    company_name: j.company_name,
    position_title: j.position_title,
    location: j.location,
    keywords: [...j.keywords],
    description: j.description,
    image_url: suggestJobImageUrl(j.position_title, j.company_name, [...j.keywords]),
    is_active: true,
    job_url: null,
    salary_range: null,
    work_location: j.location.includes("Remote")
      ? ("remote" as const)
      : j.location.includes("Hybride")
        ? ("hybrid" as const)
        : ("in_person" as const),
    employment_type: j.position_title.toLowerCase().includes("stagiaire")
      ? "internship"
      : "full_time",
  }));

  const { error: insertErr } = await supabase.from("jobs").insert(rows);
  if (insertErr) {
    console.error("[ensureDemoJobsIfEmpty]", insertErr);
    throw new Error("Impossible de créer les offres de démonstration.");
  }

  revalidatePath("/jobs");
  revalidatePath("/home");
  return { seeded: rows.length };
}
