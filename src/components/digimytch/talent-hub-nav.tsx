"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isDigimytchTalentHub } from "@/lib/digimytch-config";
import {
  LayoutDashboard,
  Briefcase,
  GraduationCap,
  FileUser,
  ClipboardList,
  Mic,
} from "lucide-react";

export const talentHubLinks = [
  { href: "/home", label: "Accueil", icon: LayoutDashboard },
  { href: "/resumes", label: "CV", icon: FileUser },
  { href: "/jobs", label: "Matching", icon: Briefcase },
  { href: "/formations", label: "Formations", icon: GraduationCap },
  { href: "/candidatures", label: "Candidatures", icon: ClipboardList },
  { href: "/entretiens", label: "Entretiens", icon: Mic },
] as const;

export function TalentHubNav() {
  const pathname = usePathname();
  if (!isDigimytchTalentHub()) return null;

  return (
    <nav className="hidden lg:flex items-center gap-0.5 ml-2 xl:ml-4 flex-wrap max-w-[min(100%,52rem)]">
      {talentHubLinks.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/home"
            ? pathname === "/home"
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
              active
                ? "bg-purple-100 text-purple-900"
                : "text-purple-700/80 hover:bg-purple-50 hover:text-purple-900"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xl:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function TalentHubMobileNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  if (!isDigimytchTalentHub()) return null;

  return (
    <div className="flex flex-col gap-1 border-t border-purple-100 pt-3 mt-2">
      <p className="text-xs font-semibold text-muted-foreground px-1">Digimytch Talent Hub</p>
      {talentHubLinks.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/home"
            ? pathname === "/home"
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
              active ? "bg-purple-100 text-purple-900" : "text-purple-800 hover:bg-purple-50"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
