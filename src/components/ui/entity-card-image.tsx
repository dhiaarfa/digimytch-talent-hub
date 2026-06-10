"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen, Briefcase, Code2, Database, Cloud, Shield, Brain, Terminal,
  BarChart2, Palette, Megaphone, DollarSign, Users, Globe, Mic2, Rocket,
} from "lucide-react";

export type EntityCardImageVariant = "course" | "job";

const ASPECT: Record<EntityCardImageVariant, string> = {
  course: "aspect-[16/9]",
  job: "aspect-[16/10]",
};

// Category → gradient + icon for fallback / when no image
export const CATEGORY_THEMES: Record<string, { gradient: string; icon: typeof BookOpen }> = {
  "web": { gradient: "from-blue-600 to-violet-700", icon: Code2 },
  "javascript": { gradient: "from-yellow-500 to-orange-600", icon: Code2 },
  "react": { gradient: "from-cyan-500 to-blue-600", icon: Code2 },
  "node": { gradient: "from-green-600 to-teal-700", icon: Terminal },
  "python": { gradient: "from-blue-500 to-indigo-700", icon: Terminal },
  "sql": { gradient: "from-slate-600 to-blue-800", icon: Database },
  "database": { gradient: "from-slate-600 to-blue-800", icon: Database },
  "devops": { gradient: "from-gray-700 to-slate-800", icon: Cloud },
  "docker": { gradient: "from-sky-500 to-blue-700", icon: Cloud },
  "cloud": { gradient: "from-sky-400 to-indigo-600", icon: Cloud },
  "security": { gradient: "from-red-600 to-rose-800", icon: Shield },
  "cyber": { gradient: "from-red-700 to-slate-900", icon: Shield },
  "ai": { gradient: "from-purple-600 to-pink-700", icon: Brain },
  "machine learning": { gradient: "from-purple-500 to-indigo-700", icon: Brain },
  "data": { gradient: "from-teal-600 to-cyan-800", icon: BarChart2 },
  "design": { gradient: "from-pink-500 to-purple-700", icon: Palette },
  "ux": { gradient: "from-rose-400 to-pink-700", icon: Palette },
  "marketing": { gradient: "from-orange-500 to-red-700", icon: Megaphone },
  "finance": { gradient: "from-emerald-600 to-green-800", icon: DollarSign },
  "management": { gradient: "from-blue-700 to-indigo-900", icon: Users },
  "communication": { gradient: "from-violet-500 to-purple-800", icon: Globe },
  "english": { gradient: "from-blue-400 to-indigo-600", icon: Globe },
  "career": { gradient: "from-amber-500 to-orange-700", icon: Rocket },
  "leadership": { gradient: "from-indigo-600 to-violet-800", icon: Users },
  "entrepreneur": { gradient: "from-amber-600 to-orange-800", icon: Rocket },
  "presentation": { gradient: "from-violet-600 to-indigo-800", icon: Mic2 },
  "default-course": { gradient: "from-[#030A8C] to-[#D10069]", icon: BookOpen },
  "default-job": { gradient: "from-slate-700 to-[#030A8C]", icon: Briefcase },
};

function getCategoryTheme(hay: string, variant: EntityCardImageVariant) {
  const lower = hay.toLowerCase();
  for (const [key, theme] of Object.entries(CATEGORY_THEMES)) {
    if (lower.includes(key)) return theme;
  }
  return CATEGORY_THEMES[variant === "course" ? "default-course" : "default-job"];
}

type EntityCardImageProps = {
  src: string;
  alt: string;
  variant: EntityCardImageVariant;
  /** Used to choose the gradient theme when the image fails */
  categoryHint?: string;
  className?: string;
  compact?: boolean;
  priority?: boolean;
};

export function EntityCardImage({
  src,
  alt,
  variant,
  categoryHint = "",
  className,
  compact = false,
  priority = false,
}: EntityCardImageProps) {
  const [failed, setFailed] = useState(false);
  const theme = getCategoryTheme(categoryHint || alt, variant);

  const fallback = compact ? (
    <CompactFallback theme={theme} />
  ) : (
    <BannerFallback theme={theme} label={alt} />
  );

  if (compact) {
    return (
      <div
        className={cn(
          "relative shrink-0 w-24 sm:w-28 rounded-lg overflow-hidden",
          ASPECT[variant],
          className
        )}
      >
        {!failed && src ? (
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
          fallback
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        ASPECT[variant],
        className
      )}
    >
      {!failed && src ? (
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
        fallback
      )}
      {/* Gradient overlay for text legibility */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
        aria-hidden
      />
    </div>
  );
}

function BannerFallback({
  theme,
  label,
}: {
  theme: { gradient: string; icon: typeof BookOpen };
  label: string;
}) {
  const Icon = theme.icon;
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br",
        theme.gradient
      )}
    >
      <Icon className="h-10 w-10 text-white/80" aria-hidden />
      <span className="text-xs font-medium text-white/60 px-4 text-center leading-tight line-clamp-2 max-w-[80%]">
        {label}
      </span>
    </div>
  );
}

function CompactFallback({
  theme,
}: {
  theme: { gradient: string; icon: typeof BookOpen };
}) {
  const Icon = theme.icon;
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-gradient-to-br",
        theme.gradient
      )}
    >
      <Icon className="h-6 w-6 text-white/90" aria-hidden />
    </div>
  );
}
