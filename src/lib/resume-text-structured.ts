import { z } from "zod";
import { textImportSchema } from "@/lib/zod-schemas";

export type TextImportContent = z.infer<typeof textImportSchema>;

type SectionId =
  | "header"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "other";

const SECTION_HEADERS: { id: SectionId; pattern: RegExp }[] = [
  { id: "summary", pattern: /^(professional\s+summary|summary|résumé|profil|profile|objective|à\s+propos|about(\s+me)?)$/i },
  { id: "experience", pattern: /^(professional\s+experience|work\s+experience|experience|expériences?(?:\s+professionnelle(s)?)?|employment|parcours\s+professionnel|carrière)$/i },
  { id: "education", pattern: /^(education|formation|formations|études|academic(\s+background)?|scolarité)$/i },
  { id: "skills", pattern: /^(skills?|compétences|technical\s+skills|core\s+competencies|aptitudes|technologies)$/i },
  { id: "projects", pattern: /^(projects?|projets|personal\s+projects?)$/i },
  { id: "certifications", pattern: /^(certifications?|certificats?|licenses?|licences?)$/i },
];

const DATE_RANGE =
  /(\d{4}\s*[-–—]\s*(?:Present|Présent|Actuel|Current|\d{4})|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z.]*\s+\d{4}\s*[-–—]\s*(?:Present|Présent|Current|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z.]*\s+\d{4}|\d{4}))/i;

const BULLET_RE = /^[-•*●▪◦]\s+|^\d+[.)]\s+/;

function normalizeLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function isSectionHeader(line: string): SectionId | null {
  const trimmed = normalizeLine(line);
  if (!trimmed || trimmed.length > 72) return null;
  if (BULLET_RE.test(trimmed)) return null;

  for (const { id, pattern } of SECTION_HEADERS) {
    if (pattern.test(trimmed)) return id;
  }
  return null;
}

function splitSections(lines: string[]): Map<SectionId, string[]> {
  const sections = new Map<SectionId, string[]>();
  let current: SectionId = "header";

  const push = (id: SectionId, line: string) => {
    const list = sections.get(id) ?? [];
    list.push(line);
    sections.set(id, list);
  };

  for (const raw of lines) {
    const line = normalizeLine(raw);
    if (!line) continue;
    const header = isSectionHeader(line);
    if (header) {
      current = header;
      continue;
    }
    push(current, line);
  }

  return sections;
}

function parseContact(text: string, headerLines: string[]) {
  const email = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/)?.[0];
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim();
  const linkedin = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[\w/-]+/i)?.[0];
  const github = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i)?.[0];
  const website = text.match(/https?:\/\/(?!www\.linkedin|github)[\w.-]+\.\w{2,}(?:\/[\w./-]*)?/i)?.[0];

  let first_name = "";
  let last_name = "";
  let location = "";

  for (const line of headerLines.slice(0, 8)) {
    if (line.includes("@") || line.match(/^\+?\d/) || line.match(/^https?:\/\//i)) continue;
    if (line.match(/linkedin|github/i)) continue;
    if (!first_name && line.length < 60 && line.split(/\s+/).length <= 6) {
      const parts = line.split(/\s+/);
      first_name = parts[0] ?? "";
      last_name = parts.slice(1).join(" ");
      continue;
    }
    if (!location && line.length < 80 && /,/.test(line)) {
      location = line;
    }
  }

  return {
    first_name: first_name || undefined,
    last_name: last_name || undefined,
    email,
    phone_number: phone,
    location: location || undefined,
    linkedin_url: linkedin,
    github_url: github,
    website,
  };
}

function toBullets(lines: string[]): string[] {
  const bullets: string[] = [];
  for (const line of lines) {
    const cleaned = line.replace(BULLET_RE, "").trim();
    if (cleaned.length > 2) bullets.push(cleaned);
  }
  return bullets;
}

function parseJobHeader(line: string): { position: string; company: string; date: string } | null {
  const pipe = line.match(/^(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/);
  if (pipe) {
    return {
      position: pipe[1].trim(),
      company: pipe[2].trim(),
      date: pipe[3].trim(),
    };
  }

  const atCompany = line.match(/^(.+?)\s+at\s+(.+?)\s*\(([^)]+)\)\s*$/i);
  if (atCompany) {
    return {
      position: atCompany[1].trim(),
      company: atCompany[2].trim(),
      date: atCompany[3].trim(),
    };
  }

  const commaDash = line.match(/^(.+?),\s*(.+?)\s*[-–—]\s*(.+)$/);
  if (commaDash && DATE_RANGE.test(commaDash[3])) {
    return {
      position: commaDash[1].trim(),
      company: commaDash[2].trim(),
      date: commaDash[3].trim(),
    };
  }

  if (DATE_RANGE.test(line) && line.length < 120) {
    const dateMatch = line.match(DATE_RANGE);
    const before = line.slice(0, dateMatch?.index ?? line.length).replace(/[-–—,|]\s*$/, "").trim();
    const parts = before.split(/\s*\|\s*|\s+[-–—]\s+/);
    if (parts.length >= 2) {
      return {
        position: parts[0].trim(),
        company: parts.slice(1).join(" — ").trim(),
        date: dateMatch?.[0]?.trim() ?? "Présent",
      };
    }
    if (parts.length === 1 && parts[0]) {
      return {
        position: parts[0],
        company: "Entreprise",
        date: dateMatch?.[0]?.trim() ?? "Présent",
      };
    }
  }

  return null;
}

function parseExperienceSection(lines: string[]) {
  const jobs: TextImportContent["work_experience"] = [];
  let current: {
    position: string;
    company: string;
    date: string;
    description: string[];
  } | null = null;

  const flush = () => {
    if (current && (current.description.length > 0 || current.position)) {
      jobs.push({
        company: current.company || "Entreprise",
        position: current.position || "Poste",
        date: current.date || "Présent",
        description: current.description.length > 0 ? current.description : ["Responsabilités à compléter."],
        technologies: [],
      });
    }
    current = null;
  };

  for (const line of lines) {
    const header = parseJobHeader(line);
    if (header) {
      flush();
      current = { ...header, description: [] };
      continue;
    }

    if (BULLET_RE.test(line)) {
      if (!current) {
        current = { position: "Expérience", company: "Entreprise", date: "Présent", description: [] };
      }
      current.description.push(line.replace(BULLET_RE, "").trim());
      continue;
    }

    if (current) {
      if (current.description.length === 0) {
        current.description.push(line);
      } else {
        const last = current.description.length - 1;
        current.description[last] = `${current.description[last]} ${line}`.trim();
      }
    }
  }

  flush();
  return jobs;
}

function parseEducationSection(lines: string[]) {
  const entries: NonNullable<TextImportContent["education"]> = [];
  let pendingSchool: { school: string; date: string; lines: string[] } | null = null;

  const flushSchool = () => {
    if (!pendingSchool) return;
    let degree = pendingSchool.school;
    let field = "";
    const desc: string[] = [];

    for (const l of pendingSchool.lines) {
      const degreeField = l.match(/^(.+?)\s*\|\s*(.+)$/);
      if (degreeField && !field) {
        degree = degreeField[1].trim();
        field = degreeField[2].trim();
        continue;
      }
      if (BULLET_RE.test(l)) desc.push(l.replace(BULLET_RE, "").trim());
      else if (!field && l.length < 80) field = l;
      else desc.push(l);
    }

    entries.push({
      school: pendingSchool.school.replace(/,\s*\d{4}.*$/, "").trim(),
      degree: degree.length > 100 ? pendingSchool.school.split(",")[0].trim() : degree.split(",")[0].trim(),
      field: field || "Formation",
      date: pendingSchool.date || "",
      ...(desc.length ? { description: desc } : {}),
    });
    pendingSchool = null;
  };

  for (const line of lines) {
    const withDate = line.match(/^(.+?),\s*(\d{4}\s*[-–—]\s*(?:Present|Présent|\d{4}).*)$/i);
    const dateOnly = line.match(DATE_RANGE);

    if (withDate || (dateOnly && line.length < 120 && !BULLET_RE.test(line))) {
      flushSchool();
      const school = withDate ? withDate[1].trim() : line.replace(DATE_RANGE, "").replace(/[,|]\s*$/, "").trim();
      const date = withDate ? withDate[2].trim() : dateOnly?.[0]?.trim() ?? "";
      pendingSchool = { school, date, lines: [] };
      continue;
    }

    if (pendingSchool) pendingSchool.lines.push(line);
    else if (BULLET_RE.test(line) && entries.length > 0) {
      const last = entries[entries.length - 1];
      last.description = [...(last.description ?? []), line.replace(BULLET_RE, "").trim()];
    }
  }

  flushSchool();
  return entries;
}

function parseSkillsSection(lines: string[]) {
  const skills: NonNullable<TextImportContent["skills"]> = [];

  for (const line of lines) {
    const categoryLine = line.match(/^(.{2,40}?):\s*(.+)$/);
    if (categoryLine) {
      skills.push({
        category: categoryLine[1].trim(),
        items: categoryLine[2].split(/[,;|]/).map((s) => s.trim()).filter(Boolean),
      });
      continue;
    }

    if (BULLET_RE.test(line)) {
      const item = line.replace(BULLET_RE, "").trim();
      const last = skills[skills.length - 1];
      if (last?.category === "Compétences") last.items.push(item);
      else skills.push({ category: "Compétences", items: [item] });
      continue;
    }

    const items = line.split(/[,;|]/).map((s) => s.trim()).filter((s) => s.length > 1);
    if (items.length >= 2) {
      skills.push({ category: "Compétences", items });
    }
  }

  return skills;
}

function parseProjectsSection(lines: string[]) {
  const projects: NonNullable<TextImportContent["projects"]> = [];
  let current: { name: string; description: string[]; date?: string } | null = null;

  const flush = () => {
    if (current) {
      projects.push({
        name: current.name,
        description: current.description.length ? current.description : ["Description du projet."],
        ...(current.date ? { date: current.date } : {}),
        technologies: [],
      });
    }
    current = null;
  };

  for (const line of lines) {
    if (!BULLET_RE.test(line) && line.length < 80 && !current) {
      flush();
      const dateMatch = line.match(DATE_RANGE);
      current = {
        name: dateMatch ? line.replace(DATE_RANGE, "").replace(/[-–—,]\s*$/, "").trim() : line,
        description: [],
        date: dateMatch?.[0],
      };
      continue;
    }

    if (!current) current = { name: "Projet", description: [] };
    if (BULLET_RE.test(line)) current.description.push(line.replace(BULLET_RE, "").trim());
    else if (current.description.length === 0) current.description.push(line);
    else current.description[current.description.length - 1] += ` ${line}`;
  }

  flush();
  return projects;
}

/** Structured CV import without AI — splits sections, jobs, education, skills. */
export function parseResumeTextStructured(raw: string): TextImportContent {
  const text = raw.trim();
  const lines = text.split(/\r?\n/).map(normalizeLine).filter(Boolean);
  const sections = splitSections(lines);

  const contact = parseContact(text, sections.get("header") ?? []);
  const summaryLines = sections.get("summary") ?? [];
  const experienceLines = sections.get("experience") ?? [];
  const educationLines = sections.get("education") ?? [];
  const skillsLines = [
    ...(sections.get("skills") ?? []),
    ...(sections.get("certifications") ?? []),
  ];
  const projectLines = sections.get("projects") ?? [];

  let work_experience = parseExperienceSection(experienceLines);

  if (summaryLines.length > 0) {
    const summaryBullets = toBullets(summaryLines);
    if (summaryBullets.length > 0) {
      work_experience = [
        {
          company: "Profil",
          position: "Résumé professionnel",
          date: "",
          description: summaryBullets,
          technologies: [],
        },
        ...work_experience,
      ];
    }
  }

  if (work_experience.length === 0) {
    const headerBody = (sections.get("header") ?? []).filter(
      (l) =>
        !l.includes("@") &&
        !l.match(/^\+?\d/) &&
        !l.match(/^https?:\/\//i) &&
        l !== `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim()
    );
    const fallbackLines = [...headerBody, ...(sections.get("other") ?? [])];
    if (fallbackLines.length > 0) {
      work_experience = parseExperienceSection(fallbackLines);
    }
  }

  const education = parseEducationSection(educationLines);
  const skills = parseSkillsSection(skillsLines);
  const projects = parseProjectsSection(projectLines);

  return {
    ...contact,
    work_experience,
    education,
    skills,
    projects,
  };
}
