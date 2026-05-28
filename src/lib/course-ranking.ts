import type { Course } from "@/lib/types";

function overlapScore(courseSkills: string[], gaps: string[]): number {
  if (gaps.length === 0) return 0;
  let score = 0;
  const gapL = gaps.map((g) => g.toLowerCase());
  for (const s of courseSkills) {
    const sn = s.toLowerCase();
    if (gapL.some((g) => g === sn || sn.includes(g) || g.includes(sn))) {
      score += 1;
    }
  }
  return score;
}

/** Recommandations basées sur les écarts de compétences (CdC). */
export function rankCoursesBySkillGaps(
  courses: Course[],
  gapSkills: string[]
): { course: Course; overlap: number; rationale: string }[] {
  const ranked = courses.map((course) => {
    const targeted = course.skills_targeted ?? [];
    const overlap = overlapScore(targeted, gapSkills);
    const rationale =
      overlap > 0
        ? `Recouvre ${overlap} compétence(s) parmi les écarts identifiés : ${targeted.join(", ")}`
        : "Formation du catalogue Digimytch — utile pour compléter votre profil.";
    return { course, overlap, rationale };
  });
  ranked.sort((a, b) => b.overlap - a.overlap);
  return ranked;
}
