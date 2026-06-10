import type { Job, Resume } from "@/lib/types";

const EMBEDDING_DIM = 1536;

export function buildResumeEmbeddingText(resume: Resume): string {
  const skillLines = (resume.skills ?? [])
    .flatMap((g) => g.items ?? [])
    .filter(Boolean);

  const titles = (resume.work_experience ?? [])
    .map((w) => w.position)
    .filter(Boolean)
    .slice(0, 3);

  const summary =
    (resume as Resume & { professional_summary?: string }).professional_summary?.trim() ||
    resume.target_role?.trim() ||
    "";

  return [skillLines.join(", "), titles.join(" · "), summary]
    .filter((p) => p.length > 0)
    .join("\n")
    .slice(0, 8000);
}

export function buildJobEmbeddingText(job: Job): string {
  const skills = (job.keywords ?? []).map(String).filter(Boolean).join(", ");
  const desc = (job.description ?? "").trim().slice(0, 200);
  return [job.position_title, skills, desc].filter((p) => p.length > 0).join("\n").slice(0, 8000);
}

/** Deterministic pseudo-embedding for local dev when OpenRouter is unavailable. */
export function mockEmbeddingFromText(text: string, dimensions = EMBEDDING_DIM): number[] {
  const out = new Array<number>(dimensions).fill(0);
  const normalized = text.toLowerCase().trim();
  if (!normalized) return out;

  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    const idx = (code * (i + 1) * 31) % dimensions;
    out[idx] += (code % 97) / 97 - 0.5;
  }

  const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0)) || 1;
  return out.map((v) => v / norm);
}

export const EMBEDDING_VECTOR_DIM = EMBEDDING_DIM;
