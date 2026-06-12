"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

// Module-level cache — shared across all instances, TTL 60 s
let _cachedData: { points: number; total_earned: number } | null = null;
let _cacheUserId: string | null = null;
let _cacheExpiry = 0;

interface LoyaltyData {
  points: number;
  total_earned: number;
}

// Points thresholds that unlock features
const LEVELS = [
  { min: 0,   max: 99,  label: "Débutant",    color: "text-slate-600 bg-slate-100" },
  { min: 100, max: 299, label: "Actif",        color: "text-blue-700 bg-blue-100" },
  { min: 300, max: 599, label: "Engagé",       color: "text-violet-700 bg-violet-100" },
  { min: 600, max: 999, label: "Expert",       color: "text-amber-700 bg-amber-100" },
  { min: 1000, max: Infinity, label: "Elite",  color: "text-rose-700 bg-rose-100" },
];

function getLevel(points: number) {
  return LEVELS.findLast((l) => points >= l.min) ?? LEVELS[0];
}

// Features unlockable with points
export const PREMIUM_FEATURES = [
  { points: 100,  label: "Export CV PDF illimité" },
  { points: 200,  label: "Analyses IA avancées" },
  { points: 300,  label: "Simulations d'entretien illimitées" },
  { points: 500,  label: "Coach IA personnel (30 min/semaine)" },
  { points: 800,  label: "Accès formations premium Digimytch" },
  { points: 1000, label: "Certificat Digimytch Talent" },
];

export function LoyaltyPointsBadge({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const [data, setData] = useState<LoyaltyData | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Return cached value if still fresh for this user
      if (
        _cachedData !== null &&
        _cacheUserId === user.id &&
        Date.now() < _cacheExpiry
      ) {
        setData(_cachedData);
        return;
      }

      const { data: lp } = await supabase
        .from("loyalty_points")
        .select("points, total_earned")
        .eq("user_id", user.id)
        .maybeSingle();

      const result = lp ?? { points: 0, total_earned: 0 };
      _cachedData = result;
      _cacheUserId = user.id;
      _cacheExpiry = Date.now() + 60_000; // 60 s TTL
      setData(result);
    })();
  }, []);

  if (!data) return null;
  if (data.points === 0 && data.total_earned === 0) return null;

  const level = getLevel(data.points);
  const nextFeature = PREMIUM_FEATURES.find((f) => f.points > data.points);

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40",
          className
        )}
      >
        <Star className="h-4 w-4 fill-amber-500 text-amber-500 shrink-0" aria-hidden />
        <span className="text-sm font-bold text-amber-800 dark:text-amber-300">{data.points}</span>
        <span className="text-xs text-amber-600 dark:text-amber-400">pts</span>
        <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded-full", level.color)}>
          {level.label}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800/30 p-5 space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <Star className="h-5 w-5 fill-amber-500 text-amber-500" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Points fidélité</p>
            <p className="font-display font-bold text-2xl text-amber-900 dark:text-amber-200 leading-none">
              {data.points}
            </p>
          </div>
        </div>
        <span className={cn("text-sm font-bold px-3 py-1 rounded-full", level.color)}>
          {level.label}
        </span>
      </div>

      {/* Progress to next level */}
      {nextFeature && (
        <div>
          <div className="flex justify-between text-xs text-amber-700 dark:text-amber-400 mb-1">
            <span>Prochain déblocage : <strong>{nextFeature.label}</strong></span>
            <span>{data.points}/{nextFeature.points} pts</span>
          </div>
          <div className="h-2 rounded-full bg-amber-200 dark:bg-amber-900/40 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (data.points / nextFeature.points) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* How to earn */}
      <p className="text-xs text-amber-700 dark:text-amber-400">
        💡 Complétez des formations <strong>Digimytch Academy</strong> pour gagner des points et débloquer des fonctionnalités premium gratuitement.
      </p>
    </div>
  );
}
