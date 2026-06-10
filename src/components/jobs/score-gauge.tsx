"use client";

import { useEffect, useState } from "react";
import { scoreColor } from "@/lib/score-theme";

const R = 34;
const CIRC = 2 * Math.PI * R;

export function ScoreGauge({ score, size = 88 }: { score: number; size?: number }) {
  // score === -1 means "no CV" — show a placeholder instead of 0
  const noScore = score < 0;
  const [display, setDisplay] = useState(0);
  const color = noScore ? "var(--digi-border)" : scoreColor(score);
  const progress = noScore ? 0 : Math.min(100, Math.max(0, score));
  const offset = CIRC - (progress / 100) * CIRC;

  // Animated count-up
  useEffect(() => {
    if (noScore) return;
    let frame: number;
    const start = performance.now();
    const duration = 900;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const t = easeOut(Math.min(1, (now - start) / duration));
      setDisplay(Math.round(score * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score, noScore]);

  const label = noScore
    ? "Complétez votre CV"
    : score >= 70 ? "Excellent" : score >= 50 ? "Bon" : score >= 30 ? "Moyen" : "Faible";

  return (
    <div className="flex flex-col items-center gap-1" aria-label={`Score de compatibilité : ${display} sur 100`}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        {/* Background track */}
        <circle
          cx="40" cy="40" r={R}
          fill="none"
          stroke="var(--digi-border)"
          strokeWidth="6"
        />
        {/* Progress arc */}
        <circle
          cx="40" cy="40" r={R}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
        {/* Score number */}
        <text
          x="40" y="37"
          textAnchor="middle"
          fill="var(--digi-dark)"
          fontSize="18"
          fontWeight="700"
          fontFamily="var(--font-display)"
        >
          {noScore ? "—" : display}
        </text>
        {/* /100 label */}
        <text
          x="40" y="50"
          textAnchor="middle"
          fill="var(--digi-muted)"
          fontSize="9"
          fontFamily="var(--font-body)"
        >
          {noScore ? "CV requis" : "/100"}
        </text>
      </svg>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ color, background: `${color}18` }}
      >
        {label}
      </span>
    </div>
  );
}
