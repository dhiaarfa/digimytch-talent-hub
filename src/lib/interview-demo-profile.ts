import type { Profile } from "@/lib/types";
import { buildProfileBrief } from "@/lib/interview-simulator";

const DEMO_NOW = "2024-01-01T00:00:00.000Z";

/** Profil fictif pour démo soutenance (entretien sans CV complété). */
export const DEMO_INTERVIEW_PROFILE: Profile = {
  id: "demo",
  user_id: "demo",
  first_name: "Alex",
  last_name: "Martin",
  full_name: "Alex Martin",
  email: "demo@digimytch.local",
  phone_number: "+216 00 000 000",
  location: "Tunis",
  website: null,
  linkedin_url: null,
  github_url: null,
  work_experience: [
    {
      position: "Développeur Full Stack",
      company: "TechStart SARL",
      location: "Tunis",
      date: "2022 — présent",
      description: [
        "Développement d'applications React / Next.js",
        "API REST Node.js et PostgreSQL",
        "Déploiement Docker et CI/CD",
      ],
    },
  ],
  education: [
    {
      degree: "Licence Informatique",
      school: "ISI Tunis",
      field: "Génie logiciel",
      location: "Tunis",
      date: "2021",
    },
  ],
  skills: [
    { category: "Frontend", items: ["React", "TypeScript", "Next.js", "Tailwind"] },
    { category: "Backend", items: ["Node.js", "PostgreSQL", "Supabase", "REST"] },
  ],
  projects: [],
  created_at: DEMO_NOW,
  updated_at: DEMO_NOW,
};

export const DEMO_INTERVIEW_PROFILE_BRIEF = buildProfileBrief(DEMO_INTERVIEW_PROFILE);

export const DEMO_INTERVIEW_TARGET_ROLE = "Développeur Full Stack Junior";
