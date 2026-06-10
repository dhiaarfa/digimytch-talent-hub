import { parseResumeTextStructured } from "@/lib/resume-text-structured";
import type { Job, Resume } from "@/lib/types";

function hashContent(content: string): string {
  let hash = 2166136261;
  for (let i = 0; i < content.length; i += 1) {
    hash ^= content.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function scoringStorageKey(parts: {
  resumeId?: string;
  cvText?: string;
  jobText?: string;
}): string {
  if (parts.resumeId) return parts.resumeId;
  return `adhoc-${hashContent(`${parts.cvText ?? ""}|${parts.jobText ?? ""}`)}`;
}

export function resumeFromCvText(
  cvText: string,
  userId: string,
  options?: { targetRole?: string; storageId?: string; withJobContext?: boolean }
): Resume {
  const parsed = parseResumeTextStructured(cvText.trim());
  const storageId = options?.storageId ?? scoringStorageKey({ cvText });
  const first = parsed.first_name?.trim() ?? "";
  const last = parsed.last_name?.trim() ?? "";
  const displayName = [first, last].filter(Boolean).join(" ").trim() || "CV importé";

  return {
    id: storageId,
    user_id: userId,
    name: displayName,
    target_role: options?.targetRole?.trim() || "Poste visé",
    is_base_resume: !options?.withJobContext,
    first_name: first || "Candidat",
    last_name: last || "",
    email: parsed.email?.trim() ?? "",
    phone_number: parsed.phone_number?.trim(),
    location: parsed.location?.trim(),
    website: parsed.website?.trim(),
    linkedin_url: parsed.linkedin_url?.trim(),
    github_url: parsed.github_url?.trim(),
    work_experience: (parsed.work_experience ?? []).map((w) => ({
      company: w.company,
      position: w.position,
      location: w.location,
      date: w.date,
      description: w.description ?? [],
      technologies: w.technologies,
    })),
    education: (parsed.education ?? []).map((e) => ({
      school: e.school,
      degree: e.degree,
      field: e.field ?? "",
      location: e.location,
      date: e.date ?? "",
      achievements: e.achievements,
    })),
    skills: (parsed.skills ?? []).map((s) => ({
      category: s.category,
      items: s.items ?? [],
    })),
    projects: (parsed.projects ?? []).map((p) => ({
      name: p.name,
      description: p.description ?? [],
      technologies: p.technologies,
      date: p.date,
      url: p.url,
      github_url: p.github_url,
    })),
    has_cover_letter: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function jobFromPostingText(jobText: string, userId: string): Job {
  const trimmed = jobText.trim();
  const firstLine =
    trimmed
      .split(/\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 2) ?? "Poste visé";

  return {
    id: `adhoc-job-${hashContent(trimmed)}`,
    user_id: userId,
    company_name: "Entreprise (annonce importée)",
    position_title: firstLine.slice(0, 120),
    job_url: null,
    description: trimmed,
    location: null,
    salary_range: null,
    keywords: [],
    work_location: null,
    employment_type: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  };
}
