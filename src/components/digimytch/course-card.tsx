"use client";

import type { Course } from "@/lib/types";
import { resolveCourseImage } from "@/lib/card-images";
import { EntityCardImage } from "@/components/ui/entity-card-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

type CourseCardProps = {
  course: Course;
  viewMode: "grid" | "list";
  overlap?: number;
  rationale?: string;
  gapSet: Set<string>;
  priority?: boolean;
};

export function CourseCard({
  course,
  viewMode,
  overlap = 0,
  rationale,
  gapSet,
  priority = false,
}: CourseCardProps) {
  const image = resolveCourseImage(course);
  const isGrid = viewMode === "grid";

  const skills = (
    <div className="flex flex-wrap gap-1">
      {course.skills_targeted.map((skill, skillIndex) => (
        <span
          key={`${course.id}-${skill}-${skillIndex}`}
          className={cn(
            "text-xs px-2 py-0.5 rounded-full border",
            gapSet.has(skill.toLowerCase())
              ? "border-[var(--digi-orange)] bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
              : "border-[var(--digi-border)] bg-white text-[var(--digi-muted)] dark:bg-[var(--digi-card)]"
          )}
        >
          {gapSet.has(skill.toLowerCase()) ? `⚡ ${skill}` : skill}
        </span>
      ))}
    </div>
  );

  const actions = course.url ? (
    <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
      <Link href={course.url} target="_blank" rel="noopener noreferrer">
        S&apos;inscrire →
      </Link>
    </Button>
  ) : null;

  if (!isGrid) {
    return (
      <article className="group flex gap-3 rounded-xl border border-[var(--digi-border)] bg-card overflow-hidden hover:shadow-md transition-shadow">
        <EntityCardImage
          src={image.src}
          alt={image.alt}
          variant="course"
          compact
          priority={priority}
        />
        <div className="flex flex-1 flex-col gap-2 py-3 pr-3 min-w-0">
          <div className="flex flex-wrap justify-between gap-2 items-start">
            <h3 className="font-medium text-sm leading-snug">{course.title}</h3>
            {overlap > 0 && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Recommandée
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {course.provider} · {course.level}
          </p>
          {rationale ? <p className="text-xs text-violet-800/90 dark:text-violet-300">{rationale}</p> : null}
          {skills}
          {actions}
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col rounded-xl border border-[var(--digi-border)] bg-card overflow-hidden hover:shadow-md transition-shadow">
      <EntityCardImage src={image.src} alt={image.alt} variant="course" priority={priority} />
      <div className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap justify-between gap-2 items-start">
          <h3 className="font-medium leading-snug">{course.title}</h3>
          {overlap > 0 && (
            <Badge className="shrink-0 text-xs">
              {overlap} correspondance{overlap > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {course.provider} · {course.level}
        </p>
        {rationale ? <p className="text-sm text-muted-foreground">{rationale}</p> : null}
        {skills}
        {actions}
      </div>
    </article>
  );
}
