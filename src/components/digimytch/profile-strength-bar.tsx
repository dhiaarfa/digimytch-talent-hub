"use client";

import type { Resume } from "@/lib/types";
import { scoreColor } from "@/lib/score-theme";

function computeStrength(resume: Resume | null): {
  score: number;
  message: string;
} {
  if (!resume) {
    return { score: 0, message: "Créez votre CV pour commencer." };
  }

  let score = 0;
  const hasBasic =
    Boolean(resume.first_name?.trim()) &&
    Boolean(resume.last_name?.trim()) &&
    Boolean(resume.email?.trim());
  if (hasBasic) score += 20;

  const expCount = resume.work_experience?.length ?? 0;
  if (expCount >= 1) score += 25;

  const skillCount =
    resume.skills?.reduce((n, c) => n + (c.items?.length ?? 0), 0) ?? 0;
  if (skillCount >= 3) score += 20;

  if ((resume.education?.length ?? 0) >= 1) score += 20;

  if (Boolean(resume.target_role?.trim())) score += 15;

  let message = "Ajoutez vos expériences professionnelles pour renforcer votre profil.";
  if (score >= 70) {
    message = "Profil bien rempli ! Analysez votre première offre d'emploi.";
  } else if (score >= 40) {
    message = "Renseignez vos compétences techniques pour améliorer vos matchings.";
  }

  return { score: Math.min(100, score), message };
}

export function ProfileStrengthBar({ resume }: { resume: Resume | null }) {
  const { score, message } = computeStrength(resume);
  const color = scoreColor(score);

  return (
    <div className="rounded-lg border border-[var(--digi-border)] bg-white p-4 mb-4">
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-[var(--digi-dark)]">Force du profil</span>
        <span className="font-semibold" style={{ color }}>
          {score}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--digi-border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <p className="text-xs text-[var(--digi-muted)] mt-2">{message}</p>
    </div>
  );
}
