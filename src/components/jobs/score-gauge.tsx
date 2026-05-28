"use client";

import { useEffect, useState } from "react";
import { scoreColor } from "@/lib/score-theme";

const R = 36;
const CIRC = 2 * Math.PI * R;

export function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const [display, setDisplay] = useState(0);
  const color = scoreColor(score);
  const offset = CIRC - (score / 100) * CIRC;

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1000;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(score * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-label={`Score ${display} sur 100`}>
      <circle cx="40" cy="40" r={R} fill="none" stroke="var(--digi-border)" strokeWidth="8" />
      <circle
        cx="40"
        cy="40"
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        transform="rotate(-90 40 40)"
        className="transition-[stroke-dashoffset] duration-1000 ease-out"
      />
      <text
        x="40"
        y="44"
        textAnchor="middle"
        className="fill-[var(--digi-dark)] text-lg font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {display}
      </text>
    </svg>
  );
}
