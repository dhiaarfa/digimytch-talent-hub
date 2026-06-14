"use client";

import { AppImage } from "@/components/ui/app-image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  UnsavedNavigationGuardProvider,
  useUnsavedNavigationPrompt,
} from "@/contexts/unsaved-navigation-guard";
import { DigimytchModelSelector } from "@/components/digimytch/digimytch-model-selector";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/ui/notification-center";
import dynamic from "next/dynamic";

const LoyaltyPointsBadge = dynamic(
  () =>
    import("@/components/digimytch/loyalty-points-badge").then((m) => ({
      default: m.LoyaltyPointsBadge,
    })),
  { ssr: false, loading: () => null }
);
import { getDefaultModel } from "@/lib/ai-models";
import { PFE_TAGLINE } from "@/lib/digimytch-branding";
import { useDefaultModel } from "@/hooks/use-api-keys";
import { useLanguage } from "@/lib/use-language";
import { appCopy } from "@/lib/digi-i18n";
import {
  LayoutDashboard,
  FileText,
  Target,
  BookOpen,
  ClipboardList,
  Mic,
  Settings,
  Linkedin,
  BarChart3,
  Trash2,
  User,
  MoreHorizontal,
  X,
} from "lucide-react";

// Primary mobile nav (always visible — 5 items)
const MOBILE_PRIMARY_ROUTES = [
  { href: "/home", icon: LayoutDashboard, labelKey: "navHome" as const },
  { href: "/resumes", icon: FileText, labelKey: "navResume" as const },
  { href: "/jobs", icon: Target, labelKey: "navJobs" as const },
  { href: "/candidatures", icon: ClipboardList, labelKey: "navApplications" as const },
  { href: "/entretiens", icon: Mic, labelKey: "navInterviews" as const },
] as const;

// Secondary items shown in the "Plus" sheet
const MOBILE_SECONDARY_ROUTES = [
  { href: "/score-cv", icon: BarChart3, labelKey: "navScoreCv" as const },
  { href: "/linkedin", icon: Linkedin, labelKey: "navLinkedIn" as const },
  { href: "/formations", icon: BookOpen, labelKey: "navCourses" as const },
] as const;

const CANDIDATE_NAV_ROUTES = [
  { href: "/home", icon: LayoutDashboard, labelKey: "navHome" as const },
  { href: "/resumes", icon: FileText, labelKey: "navResume" as const },
  { href: "/score-cv", icon: BarChart3, labelKey: "navScoreCv" as const },
  { href: "/jobs", icon: Target, labelKey: "navJobs" as const },
  { href: "/linkedin", icon: Linkedin, labelKey: "navLinkedIn" as const },
  { href: "/formations", icon: BookOpen, labelKey: "navCourses" as const },
  { href: "/candidatures", icon: ClipboardList, labelKey: "navApplications" as const },
  { href: "/entretiens", icon: Mic, labelKey: "navInterviews" as const },
  { href: "/corbeille", icon: Trash2, labelKey: "navTrash" as const },
] as const;

const ADMIN_PREFETCH_ROUTES = ["/admin", "/profile", "/settings"] as const;
const CANDIDATE_PREFETCH_ROUTES = [
  ...CANDIDATE_NAV_ROUTES.map((r) => r.href),
  "/profile",
  "/settings",
] as const;

const ADMIN_NAV_ROUTES = [
  { href: "/admin", icon: Settings, labelKey: "navAdmin" as const },
] as const;

function NavLink({
  href,
  icon: Icon,
  label,
  mobile,
  dataTour,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  mobile?: boolean;
  dataTour?: string;
}) {
  const pathname = usePathname();
  const { promptNavigation, isBlocking } = useUnsavedNavigationPrompt();
  const active =
    href === "/home"
      ? pathname === "/home"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      prefetch={true}
      title={label}
      data-tour={dataTour}
      onClick={(e) => {
        if (!isBlocking) return;
        e.preventDefault();
        promptNavigation(href);
      }}
      className={cn(
        "flex items-center gap-2 rounded-lg transition-colors",
        mobile
          ? "flex-col justify-center flex-1 shrink-0 px-1 py-2.5 text-[10px] font-medium"
          : "px-3 py-2.5 text-sm font-medium min-h-[2.75rem]",
        active
          ? mobile
            ? "text-[var(--digi-accent)]"
            : "bg-gradient-to-r from-[var(--color-primary-blue)] to-[var(--color-accent-magenta)] text-white shadow-sm"
          : mobile
            ? "text-[var(--digi-muted)]"
            : "text-[var(--digi-muted)] hover:bg-white/80"
      )}
    >
      <Icon className={cn(mobile ? "h-5 w-5" : "h-4 w-4 shrink-0")} aria-hidden />
      <span className={cn(mobile ? "leading-tight" : "flex-1 truncate")}>{label}</span>
    </Link>
  );
}

function SidebarFooterLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: typeof User;
  label: string;
  active?: boolean;
}) {
  const { promptNavigation, isBlocking } = useUnsavedNavigationPrompt();

  return (
    <Link
      href={href}
      prefetch={true}
      onClick={(e) => {
        if (!isBlocking) return;
        e.preventDefault();
        promptNavigation(href);
      }}
      className={cn(
        "flex items-center gap-2.5 rounded-lg transition-colors w-full",
        "px-3 py-3 min-h-[2.875rem] text-sm font-medium",
        active
          ? "bg-gradient-to-r from-[var(--color-primary-blue)] to-[var(--color-accent-magenta)] text-white shadow-sm"
          : "text-[var(--digi-muted)] hover:bg-white/80 hover:text-[var(--digi-navy)] dark:hover:bg-[var(--digi-card)]"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

function SidebarFooterLogout({ label }: { label: string }) {
  return (
    <LogoutButton
      className={cn(
        "w-full justify-start gap-2.5 rounded-lg px-3 py-3 min-h-[2.875rem]",
        "h-auto text-sm font-medium text-[var(--digi-muted)]",
        "hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400",
        "border-0 shadow-none bg-transparent"
      )}
      label={label}
    />
  );
}

function MobilePlusSheet({
  open,
  onClose,
  secondaryItems,
  t,
  userName,
  avatarUrl,
}: {
  open: boolean;
  onClose: () => void;
  secondaryItems: { href: string; icon: typeof LayoutDashboard; label: string }[];
  t: ReturnType<typeof appCopy>;
  userName?: string;
  avatarUrl?: string;
}) {
  const pathname = usePathname();
  const { promptNavigation, isBlocking } = useUnsavedNavigationPrompt();

  // Close on route change
  useEffect(() => {
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Sheet */}
      <div
        className="fixed bottom-[4.5rem] inset-x-0 z-[61] mx-2 rounded-2xl border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Plus de pages"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--digi-border)]">
          {userName && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#030A8C] to-[#D10069] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {userName.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-[var(--digi-navy)] truncate">{userName}</span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-[var(--digi-muted)] hover:bg-[var(--digi-surface)] transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Secondary nav items */}
        <div className="grid grid-cols-3 gap-1 p-3">
          {secondaryItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                prefetch
                onClick={(e) => {
                  if (isBlocking) {
                    e.preventDefault();
                    promptNavigation(href);
                  }
                  onClose();
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-[10px] font-medium transition-colors",
                  active
                    ? "bg-[var(--digi-accent)]/10 text-[var(--digi-accent)]"
                    : "text-[var(--digi-muted)] hover:bg-[var(--digi-surface)]"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="leading-tight text-center">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer links */}
        <div className="grid grid-cols-2 gap-1 px-3 pb-3 border-t border-[var(--digi-border)] pt-2">
          {[
            { href: "/profile", icon: User, label: t.navProfile },
            { href: "/settings", icon: Settings, label: t.navSettings },
          ].map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                prefetch
                onClick={() => onClose()}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-[var(--digi-accent)]/10 text-[var(--digi-accent)]"
                    : "text-[var(--digi-muted)] hover:bg-[var(--digi-surface)]"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>
        <div className="px-3 pb-3">
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </div>
    </>
  );
}

export function DigimytchShell({
  children,
  isProPlan,
  isAdmin = false,
  userName,
  avatarUrl,
}: {
  children: React.ReactNode;
  isProPlan: boolean;
  isAdmin?: boolean;
  userName?: string;
  avatarUrl?: string;
}) {
  const [resolvedAvatar, setResolvedAvatar] = useState(avatarUrl);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const { lang } = useLanguage();
  const t = appCopy(lang);
  const { defaultModel, setDefaultModel } = useDefaultModel();
  const navSource = isAdmin ? ADMIN_NAV_ROUTES : CANDIDATE_NAV_ROUTES;
  const navTourByHref: Record<string, string> = {
    "/jobs": "nav-jobs",
    "/entretiens": "nav-entretiens",
  };
  const navItems = navSource.map((item) => ({
    href: item.href,
    icon: item.icon,
    label: t[item.labelKey],
    dataTour: navTourByHref[item.href],
  }));
  const homeHref = isAdmin ? "/admin" : "/home";
  const hasInitialized = useRef(false);
  const prefetchDone = useRef(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (prefetchDone.current) return;
    prefetchDone.current = true;
    const routes = isAdmin 