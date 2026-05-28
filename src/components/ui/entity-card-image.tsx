"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, Briefcase } from "lucide-react";

export type EntityCardImageVariant = "course" | "job";

const ASPECT: Record<EntityCardImageVariant, string> = {
  course: "aspect-[16/9]",
  job: "aspect-[16/10]",
};

type EntityCardImageProps = {
  src: string;
  alt: string;
  variant: EntityCardImageVariant;
  className?: string;
  /** Liste : vignette compacte à gauche */
  compact?: boolean;
  priority?: boolean;
};

export function EntityCardImage({
  src,
  alt,
  variant,
  className,
  compact = false,
  priority = false,
}: EntityCardImageProps) {
  const [failed, setFailed] = useState(false);
  const Icon = variant === "course" ? BookOpen : Briefcase;

  if (compact) {
    return (
      <div
        className={cn(
          "relative shrink-0 w-24 sm:w-28 rounded-lg overflow-hidden bg-[var(--digi-surface)] border border-[var(--digi-border)]",
          ASPECT[variant],
          className
        )}
      >
        {!failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <CompactFallback Icon={Icon} variant={variant} />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-[var(--digi-surface)]",
        ASPECT[variant],
        className
      )}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          onError={() => setFailed(true)}
        />
      ) : (
        <BannerFallback Icon={Icon} variant={variant} />
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
        aria-hidden
      />
    </div>
  );
}

function BannerFallback({
  Icon,
  variant,
}: {
  Icon: typeof BookOpen;
  variant: EntityCardImageVariant;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        variant === "course"
          ? "bg-gradient-to-br from-[#030A8C]/90 to-[#D10069]/80"
          : "bg-gradient-to-br from-slate-800 to-[#030A8C]"
      )}
    >
      <Icon className="h-10 w-10 text-white/70" aria-hidden />
    </div>
  );
}

function CompactFallback({
  Icon,
  variant,
}: {
  Icon: typeof BookOpen;
  variant: EntityCardImageVariant;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        variant === "course"
          ? "bg-gradient-to-br from-violet-600 to-fuchsia-600"
          : "bg-gradient-to-br from-slate-700 to-indigo-800"
      )}
    >
      <Icon className="h-6 w-6 text-white/80" aria-hidden />
    </div>
  );
}
