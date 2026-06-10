"use client";

import type { Course } from "@/lib/types";
import { resolveCourseImage } from "@/lib/card-images";
import { EntityCardImage } from "@/components/ui/entity-card-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Star, Award } from "lucide-react";

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
    <Button asChild size="default" className="btn-digi-primary w-full sm:w-auto text-sm font-semibold px-5 py-2 h-10">
      <Link href={course.url} target="_blank" rel="noopener noreferrer">
        S&apos;inscrire
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
            <h3 className="font-medium text-base leading-snug">{course.title}</h3>
            {overlap > 0 && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Recommandée
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            {course.institution_logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.institution_logo_url} alt={course.institution ?? course.provider}
                className="h-3.5 w-auto object-contain" />
            )}
            <span className="font-medium text-[var(--digi-dark)]">{course.institution ?? course.provider}</span>
            <span>·</span>
            <span>{course.level}</span>
            {course.duration_hours && <span>· {course.duration_hours}h</span>}
          </p>
          {/* Loyalty points badge for Digimytch courses */}
          {course.is_digimytch && (course.loyalty_points_reward ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 w-fit">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden />
              <span className="font-semibold">+{course.loyalty_points_reward} pts fidélité</span>
            </div>
          )}
          {course.certificate && (
            <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 w-fit">
              <Award className="h-3 w-3 text-blue-500" aria-hidden />
              <span>Certificat inclus</span>
            </div>
          )}
          {rationale ? <p className="text-xs text-violet-800/90 dark:text-violet-300">{rationale}</p> : null}
          {skills}
          {actions}
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col rounded-xl border border-[var(--digi-border)] bg-card overflow-hidden hover:shadow-md transition-shadow">
      <EntityCardImage src={image.src} alt={image.alt} categoryHint={image.categoryHint} variant="course" priority={priority} />
      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex flex-wrap justify-between gap-2 items-start">
          <h3 className="font-medium leading-snug text-base">{course.title}</h3>
          {overlap > 0 && (
            <Badge className="shrink-0 text-xs">
              {overlap} correspondance{overlap > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <p className="text-xs text-[var(--digi-muted)] flex items-center gap-1.5 flex-wrap">
          {course.institution_logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.institution_logo_url} alt={course.institution ?? course.provider}
              className="h-3.5 w-auto object-contain" />
          )}
          <span className="font-medium text-[var(--digi-dark)]">{course.institution ?? course.provider}</span>
          <span>·</span>
          <span>{course.level}</span>
        </p>
        {/* Digimytch loyalty points + certificate */}
        <div className="flex flex-wrap gap-1">
          {course.is_digimytch && (course.loyalty_points_reward ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden />
              +{course.loyalty_points_reward} pts
            </span>
          )}
          {course.certificate && (
            <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-1.5 py-0.5">
              <Award className="h-3 w-3 text-blue-500" aria-hidden />
              Certificat
            </span>
          )}
        </div>
        {rationale ? <p className="text-xs text-violet-700/90 dark:text-violet-300">{rationale}</p> : null}
        {skills}
        <div className="mt-auto pt-2">{actions}</div>
      </div>
    </article>
  );
}
