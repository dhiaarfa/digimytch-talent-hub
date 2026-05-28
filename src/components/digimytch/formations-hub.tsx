"use client";

import { useMemo, useState } from "react";
import type { Course } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ViewModeToggle, type ViewMode } from "@/components/ui/view-mode-toggle";
import { CourseCard } from "@/components/digimytch/course-card";

type RankedItem = {
  course: Course;
  overlap: number;
  rationale: string;
};

interface FormationsHubProps {
  courses: Course[];
  ranked: RankedItem[];
  gapUnion: string[];
}

export function FormationsHub({ courses, ranked, gapUnion }: FormationsHubProps) {
  const uniqueCourses = useMemo(() => {
    const seen = new Set<string>();
    return courses.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [courses]);

  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [provider, setProvider] = useState<string>("all");
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const levels = useMemo(
    () => [...new Set(uniqueCourses.map((c) => c.level).filter(Boolean))].sort(),
    [uniqueCourses]
  );
  const providers = useMemo(
    () => [...new Set(uniqueCourses.map((c) => c.provider).filter(Boolean))].sort(),
    [uniqueCourses]
  );
  const allSkills = useMemo(
    () => [...new Set(uniqueCourses.flatMap((c) => c.skills_targeted))].sort(),
    [uniqueCourses]
  );
  const gapSet = useMemo(() => new Set(gapUnion.map((g) => g.toLowerCase())), [gapUnion]);

  const recommendedIds = useMemo(
    () => new Set(ranked.filter((r) => r.overlap > 0).map((r) => r.course.id)),
    [ranked]
  );

  const rationaleById = useMemo(
    () => new Map(ranked.map((r) => [r.course.id, r])),
    [ranked]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return uniqueCourses.filter((c) => {
      if (showRecommendedOnly && !recommendedIds.has(c.id)) return false;
      if (level !== "all" && c.level !== level) return false;
      if (provider !== "all" && c.provider !== provider) return false;
      if (skillFilter !== "all" && !c.skills_targeted.includes(skillFilter)) return false;
      if (!q) return true;
      const hay = `${c.title} ${c.provider} ${c.skills_targeted.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [uniqueCourses, search, level, provider, skillFilter, showRecommendedOnly, recommendedIds]);

  const topRanked = ranked.filter((r) => r.overlap > 0).slice(0, 6);
  const priorityIds = useMemo(() => new Set(topRanked.map((r) => r.course.id)), [topRanked]);

  const catalogCourses = useMemo(
    () => filtered.filter((c) => !priorityIds.has(c.id)),
    [filtered, priorityIds]
  );

  return (
    <div className="space-y-6">
      {gapUnion.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Écarts de compétences détectés</CardTitle>
            <CardDescription>
              {gapUnion.slice(0, 24).join(", ")}
              {gapUnion.length > 24 ? "…" : ""}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtrer le catalogue</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Rechercher une formation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher"
          />
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger aria-label="Niveau">
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              {levels.map((l, i) => (
                <SelectItem key={`level-${l}-${i}`} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger aria-label="Compétence">
              <SelectValue placeholder="Compétence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les compétences</SelectItem>
              {allSkills.map((s, i) => (
                <SelectItem key={`skill-${i}-${s}`} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger aria-label="Organisme">
              <SelectValue placeholder="Organisme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les organismes</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm cursor-pointer px-1">
            <input
              type="checkbox"
              checked={showRecommendedOnly}
              onChange={(e) => setShowRecommendedOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            Recommandées uniquement
          </label>
        </CardContent>
      </Card>

      {topRanked.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Priorité pour votre profil</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {topRanked.map(({ course, overlap, rationale }, i) => (
              <CourseCard
                key={course.id}
                course={course}
                viewMode="grid"
                overlap={overlap}
                rationale={rationale}
                gapSet={gapSet}
                priority={i < 2}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium">
            Catalogue ({catalogCourses.length}
            {catalogCourses.length !== uniqueCourses.length ? ` / ${uniqueCourses.length}` : ""})
          </h2>
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>
        {uniqueCourses.length === 0 ? (
          <p className="text-sm text-[var(--digi-muted)] py-8 text-center border border-[var(--digi-border)] rounded-lg bg-[var(--digi-surface)]">
            Le catalogue de formations apparaîtra ici une fois que vous aurez analysé au moins une offre.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[var(--digi-muted)] py-8 text-center border border-[var(--digi-border)] rounded-lg bg-[var(--digi-surface)]">
            Aucune formation ne correspond à vos filtres.
          </p>
        ) : (
          <ul
            className={
              viewMode === "grid"
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-3"
            }
          >
            {catalogCourses.map((c) => {
              const meta = rationaleById.get(c.id);
              return (
                <li key={c.id}>
                  <CourseCard
                    course={c}
                    viewMode={viewMode}
                    overlap={meta?.overlap ?? 0}
                    rationale={meta?.rationale}
                    gapSet={gapSet}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
