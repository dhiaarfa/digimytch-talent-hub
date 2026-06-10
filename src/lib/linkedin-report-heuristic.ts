import type { LinkedInReport } from "@/lib/linkedin-analyze";

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function hasSection(text: string, patterns: RegExp[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((p) => p.test(lower));
}

/**
 * Rapport LinkedIn exploitable sans generateObject (secours modèles gratuits).
 */
export function buildHeuristicLinkedInReport(
  profileText: string,
  isFr: boolean
): LinkedInReport {
  const text = profileText.trim();
  const words = wordCount(text);
  const hasAbout = hasSection(text, [/about|à propos|summary|résumé/i]);
  const hasExperience = hasSection(text, [/experience|expérience|work history/i]);
  const hasEducation = hasSection(text, [/education|formation|studies/i]);
  const hasSkills = hasSection(text, [/skills|compétences|endorsements/i]);

  let score = 35;
  if (words > 80) score += 15;
  if (words > 200) score += 10;
  if (hasAbout) score += 12;
  if (hasExperience) score += 18;
  if (hasEducation) score += 8;
  if (hasSkills) score += 10;
  score = Math.min(72, score);

  const note = isFr
    ? "Analyse estimée localement (réponse IA non structurée). Réessayez ou choisissez « openrouter/free » dans Paramètres."
    : "Local estimate (AI did not return structured output). Retry or pick « openrouter/free » in Settings.";

  const strengths = isFr
    ? [
        words > 100 ? "Texte de profil suffisamment long pour analyse." : "Capture exploitable pour extraction.",
        hasExperience ? "Section expérience détectée." : "Contenu extrait de la capture.",
      ]
    : [
        words > 100 ? "Enough profile text for review." : "Screenshot yielded readable text.",
        hasExperience ? "Experience section detected." : "Content extracted from screenshot.",
      ];

  const weaknesses = [
    !hasAbout &&
      (isFr
        ? "Résumé / À propos peu visible — ajoutez un pitch de 3–5 lignes."
        : "About/summary missing or short — add a 3–5 line pitch."),
    !hasExperience &&
      (isFr
        ? "Expériences peu lisibles sur la capture — vérifiez le cadrage."
        : "Experience hard to read — use a clearer screenshot."),
    !hasSkills &&
      (isFr
        ? "Compétences absentes ou non visibles."
        : "Skills section missing or not visible."),
  ].filter(Boolean) as string[];

  const recommendations = isFr
    ? [
        {
          priority: "Haute",
          action: "Photo pro, titre ciblé (poste + secteur) et localisation Tunisie.",
          why: "Améliore la visibilité recruteurs locaux.",
        },
        {
          priority: "Moyenne",
          action: "Quantifiez 2–3 réalisations par poste (%, délais, budget).",
          why: note,
        },
      ]
    : [
        {
          priority: "High",
          action: "Professional photo, targeted headline, Tunisia location.",
          why: "Improves recruiter discovery.",
        },
        {
          priority: "Medium",
          action: "Add metrics to 2–3 bullets per role.",
          why: note,
        },
      ];

  const firstLine = text.split("\n").find((l) => l.trim().length > 2)?.trim() ?? null;

  return {
    name: firstLine && firstLine.length < 80 ? firstLine : null,
    headline: isFr ? "Profil LinkedIn (analyse locale)" : "LinkedIn profile (local analysis)",
    score,
    strengths,
    weaknesses: weaknesses.length > 0 ? weaknesses : [note],
    recommendations,
    cvImportTips: isFr
      ? [
          "Exportez le texte OCR vers Mon CV pour harmoniser le contenu.",
          "Alignez les mots-clés avec vos offres cibles dans Digimytch.",
        ]
      : [
          "Import OCR text into My Resume to align content.",
          "Match keywords with target job postings in Digimytch.",
        ],
    keywords: extractKeywords(text).slice(0, 12),
  };
}

function extractKeywords(text: string): string[] {
  const stop = new Set(
    "le la les un une des et ou pour avec dans sur par au aux du de en est sont linkedin profile".split(
      " "
    )
  );
  const freq = new Map<string, number>();
  for (const w of text.toLowerCase().match(/[a-zàâäéèêëïîôùûüç]{4,}/gi) ?? []) {
    if (stop.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([w]) => w);
}
