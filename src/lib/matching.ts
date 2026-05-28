import type { Job, JobMatchResult, Resume } from "@/lib/types";
import { expandTechnicalSynonyms } from "@/lib/synonyms";

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "vous",
  "nous",
  "dans",
  "une",
  "des",
  "les",
  "pour",
  "par",
  "sur",
]);

function normToken(s: string): string {
  return s
    .toLowerCase()
    .replace(/c\#/g, "csharp")
    .replace(/\.net/g, "dotnet")
    .replace(/c\+\+/g, "cpp")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+#.\-]/gi, "")
    .trim();
}

/** Mots utiles extraits d’un texte libre */
function tokenizeText(text: string | null | undefined): string[] {
  if (!text) return [];
  const raw = text.toLowerCase().split(/[\s,/;|()[\]{}]+/);
  const out = new Set<string>();
  for (const w of raw) {
    const t = normToken(w);
    if (t.length < 2 || STOP.has(t)) continue;
    out.add(t);
  }
  return [...out];
}

function addTokenWithSynonyms(set: Set<string>, value: string) {
  const token = normToken(value);
  if (token.length < 2 || STOP.has(token)) return;
  for (const expanded of expandTechnicalSynonyms(token)) {
    const normalized = normToken(expanded);
    if (normalized.length >= 2 && !STOP.has(normalized)) {
      set.add(normalized);
    }
  }
}

/** Compétences et mots-clés extraits du CV (skills, expériences, projets, résumé textuel léger) */
export function collectResumeSkillTokens(resume: Resume): Set<string> {
  const s = new Set<string>();

  for (const cat of resume.skills ?? []) {
    for (const item of cat.items ?? []) {
      addTokenWithSynonyms(s, item);
    }
  }

  for (const w of resume.work_experience ?? []) {
    for (const tech of w.technologies ?? []) {
      addTokenWithSynonyms(s, tech);
    }
    for (const line of w.description ?? []) {
      for (const tok of tokenizeText(line)) addTokenWithSynonyms(s, tok);
    }
  }

  for (const p of resume.projects ?? []) {
    for (const tech of p.technologies ?? []) {
      addTokenWithSynonyms(s, tech);
    }
    for (const line of p.description ?? []) {
      for (const tok of tokenizeText(line)) addTokenWithSynonyms(s, tok);
    }
  }

  for (const e of resume.education ?? []) {
    for (const tok of tokenizeText(
      `${e.degree ?? ""} ${e.field ?? ""} ${e.school ?? ""} ${e.date ?? ""}`
    )) {
      addTokenWithSynonyms(s, tok);
    }
  }

  for (const tok of tokenizeText(resume.target_role)) addTokenWithSynonyms(s, tok);
  return s;
}

function extractExperienceBonusMap(resume: Resume): Map<string, number> {
  const bonuses = new Map<string, number>();
  const blocks = [
    ...(resume.work_experience ?? []).flatMap((w) => [
      ...(w.description ?? []),
      ...(w.technologies ?? []),
    ]),
    ...(resume.projects ?? []).flatMap((p) => [
      ...(p.description ?? []),
      ...(p.technologies ?? []),
    ]),
  ]
    .join(" ")
    .toLowerCase();

  for (const token of tokenizeText(blocks)) {
    const hasYears = new RegExp(`(\\d+)\\s*(ans|years?)\\s+${token}`).test(blocks);
    const isSenior = new RegExp(`senior\\s+${token}`).test(blocks);
    if (hasYears || isSenior) {
      bonuses.set(token, 1.3);
      for (const s of expandTechnicalSynonyms(token)) bonuses.set(normToken(s), 1.3);
    }
  }
  return bonuses;
}

function applyProfileFloorScore(score: number, resumeTokenCount: number): number {
  if (resumeTokenCount < 8) return score;
  const floor = resumeTokenCount >= 40 ? 28 : resumeTokenCount >= 20 ? 22 : 15;
  return Math.max(score, Math.min(45, floor));
}

/**
 * Score de compatibilité 0–100 + listes explicatives (CdC Digimytch).
 * Approche hybride : mots-clés structurés + recouvrement texte offre.
 * @param tokenOverride — fusion de plusieurs CV de base (tokens cumulés)
 */
export function computeResumeJobMatch(
  resume: Resume,
  job: Job,
  options?: { tokenOverride?: Set<string> }
): JobMatchResult {
  const resumeTokens = options?.tokenOverride
    ? new Set([...options.tokenOverride, ...collectResumeSkillTokens(resume)])
    : collectResumeSkillTokens(resume);
  const experienceBonuses = extractExperienceBonusMap(resume);
  const jobKeywords = (job.keywords ?? [])
    .flatMap((k) => expandTechnicalSynonyms(normToken(String(k))))
    .map((k) => normToken(String(k)))
    .filter((k) => k.length >= 2);

  const descTokens = tokenizeText(job.description ?? "");
  const jobTokenSet = new Set([...jobKeywords, ...descTokens]);

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  const keysToEvaluate =
    jobKeywords.length > 0
      ? jobKeywords
      : [...jobTokenSet].filter((t) => t.length >= 3).slice(0, 100);

  for (const kw of keysToEvaluate) {
    if (!kw) continue;
    const hit =
      resumeTokens.has(kw) ||
      [...resumeTokens].some((r) => r.includes(kw) || kw.includes(r));
    if (hit) {
      if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
    } else if (!missingKeywords.includes(kw)) {
      missingKeywords.push(kw);
    }
  }

  const matchedSkills = [...matchedKeywords].slice(0, 30);

  /**
   * Score = (keywordScore * 0.70) + (titleScore * 0.30)
   * keywordScore = |skills_CV ∩ skills_offre| / |skills_offre|
   * titleScore = titleMatch ? 1 : partialTitleMatch ? 0.5 : 0
   */
  let keywordScore = 0;
  if (jobKeywords.length > 0) {
    const weightedMatches = matchedKeywords.reduce((acc, kw) => {
      const bonus = experienceBonuses.get(kw) ?? 1;
      return acc + bonus;
    }, 0);
    keywordScore = (weightedMatches / jobKeywords.length) * 70;
  } else if (jobTokenSet.size > 0) {
    let hits = 0;
    for (const jt of jobTokenSet) {
      if (
        resumeTokens.has(jt) ||
        [...resumeTokens].some((r) => r.includes(jt) || jt.includes(r))
      )
        hits++;
    }
    keywordScore = Math.min(70, (hits / jobTokenSet.size) * 70);
  }

  const titleTokens = tokenizeText(job.position_title);
  let titleHits = 0;
  for (const tt of titleTokens) {
    if (
      resumeTokens.has(tt) ||
      [...resumeTokens].some((r) => r.includes(tt) || tt.includes(r))
    )
      titleHits++;
  }
  const titleScore =
    titleTokens.length === 0
      ? jobTokenSet.size === 0
        ? 0
        : 15
      : Math.min(30, (titleHits / titleTokens.length) * 30);

  const raw = keywordScore + titleScore;
  let score = Math.max(0, Math.min(100, Math.round(raw)));
  if (jobTokenSet.size > 0 || titleTokens.length > 0) {
    score = applyProfileFloorScore(score, resumeTokens.size);
  }

  const gapSkills = missingKeywords.slice(0, 25);

  return {
    score,
    matchedKeywords: matchedKeywords.slice(0, 40),
    missingKeywords: missingKeywords.slice(0, 40),
    matchedSkills,
    gapSkills,
  };
}
