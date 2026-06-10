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
} from "lucide-react";

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
          ? "flex-col justify-center min-w-[4.25rem] shrink-0 px-1 py-2.5 text-[10px] font-medium"
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
    const routes = isAdmin ? ADMIN_PREFETCH_ROUTES : CANDIDATE_PREFETCH_ROUTES;
    for (const href of routes) {
      router.prefetch(href);
    }
  }, [isAdmin, router]);

  useEffect(() => {
    setResolvedAvatar(avatarUrl);
    setAvatarBroken(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    if (!defaultModel) {
      setDefaultModel(getDefaultModel(isProPlan));
    }
  }, [defaultModel, isProPlan, setDefaultModel]);

  return (
    <UnsavedNavigationGuardProvider>
    <div className="flex min-h-screen bg-[var(--digi-surface)]">
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-[240px] flex-col border-r border-[var(--digi-border)] bg-white/95 dark:bg-[var(--digi-card)]/95 backdrop-blur-md">
        <div className="px-4 py-4 border-b border-[var(--digi-border)]">
          <div className="flex items-center justify-between gap-2">
            <Link href={homeHref} className="flex items-center gap-2 min-w-0">
              <AppImage
                src="/digimytch-logo.png"
                alt="Digimytch"
                width={36}
                height={36}
                className="rounded-md shrink-0"
                priority
              />
              <span className="font-display font-bold text-[var(--digi-navy)] text-sm leading-tight truncate">
                Talent Hub
                <span className="block text-[10px] font-normal text-[var(--digi-muted)]">
                  {PFE_TAGLINE}
                </span>
              </span>
            </Link>
            <NotificationBell />
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Menu principal">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        {!isAdmin && (
          <div className="px-3 pb-2">
            <Link
              href="/formations"
              className="block rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--digi-accent)]"
              title={t.navLoyalty}
            >
              <LoyaltyPointsBadge compact className="w-full justify-center" />
            </Link>
          </div>
        )}
        {!isAdmin && <DigimytchModelSelector />}
        <div className="px-3 py-3 border-t border-[var(--digi-border)] space-y-0.5">
          {userName && (
            <div className="flex items-center gap-2 min-w-0 px-1 pb-2 mb-1">
              {resolvedAvatar && !avatarBroken ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolvedAvatar}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-[var(--digi-border)]"
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#030A8C] to-[#D10069] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {userName.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <span className="text-xs font-medium text-[var(--digi-navy)] truncate">
                {userName}
              </span>
            </div>
          )}
          <SidebarFooterLink
            href="/profile"
            icon={User}
            label={t.navProfile}
            active={pathname === "/profile" || pathname.startsWith("/profile/")}
          />
          <SidebarFooterLink
            href="/settings"
            icon={Settings}
            label={t.navSettings}
            active={pathname === "/settings" || pathname.startsWith("/settings/")}
          />
          <SidebarFooterLogout label={t.navLogout} />
          <div className="flex items-center justify-start gap-1 pt-2 px-1">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </aside>

      <div className="md:hidden fixed top-3 right-3 z-50">
        <NotificationBell align="end" />
      </div>

      <div className="flex-1 flex flex-col md:pl-[240px] pb-20 md:pb-0 min-w-0">
        <main className="flex-1">{children}</main>
      </div>

      {!isAdmin && (
        <div
          className="md:hidden fixed bottom-[4.25rem] inset-x-0 z-40 flex justify-center px-3 pointer-events-none"
          aria-hidden={false}
        >
          <Link
            href="/formations"
            className="pointer-events-auto shadow-sm"
            title={t.navLoyalty}
          >
            <LoyaltyPointsBadge compact />
          </Link>
        </div>
      )}

      <nav
        className="digimytch-mobile-nav md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--digi-border)] bg-white/95 dark:bg-[var(--digi-card)]/95 backdrop-blur-md"
        aria-label="Navigation mobile"
      >
        <div className="flex overflow-x-auto scrollbar-none px-1 pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} mobile />
          ))}
        </div>
      </nav>
    </div>
    </UnsavedNavigationGuardProvider>
  );
}
