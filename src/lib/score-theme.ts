/** Score color thresholds — Digimytch design system */
export function scoreColor(score: number): string {
  if (score >= 70) return "var(--score-high)";
  if (score >= 40) return "var(--score-mid)";
  return "var(--score-low)";
}

export function scoreLabel(score: number): string {
  if (score >= 70) return "Très bon";
  if (score >= 40) return "Moyen";
  return "Faible";
}

export function scoreTailwindBg(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export function scoreTailwindText(score: number): string {
  if (score >= 70) return "text-emerald-700";
  if (score >= 40) return "text-amber-700";
  return "text-red-700";
}
