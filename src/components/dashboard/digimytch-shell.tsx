"use client";

import { AppImage } from "@/components/ui/app-image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";
import { SettingsButton } from "@/components/settings/settings-button";
import { DigimytchModelSelector } from "@/components/digimytch/digimytch-model-selector";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/utils/supabase/client";
import { NotificationBell } from "@/components/ui/notification-center";
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
} from "lucide-react";

const NAV_ROUTES = [
  { href: "/home", icon: LayoutDashboard, labelKey: "navHome" as const },
  { href: "/resumes", icon: FileText, labelKey: "navResume" as const },
  { href: "/jobs", icon: Target, labelKey: "navJobs" as const },
  { href: "/formations", icon: BookOpen, labelKey: "navCourses" as const },
  { href: "/candidatures", icon: ClipboardList, labelKey: "navApplications" as const },
  { href: "/entretiens", icon: Mic, labelKey: "navInterviews" as const, badge: "IA" as const },
] as const;

function NavLink({
  href,
  icon: Icon,
  label,
  mobile,
  badge,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  mobile?: boolean;
  badge?: string;
}) {
  const pathname = usePathname();
  const active =
    href === "/home"
      ? pathname === "/home"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      prefetch={true}
      title={label}
      className={cn(
        "flex items-center gap-2 rounded-lg transition-colors",
        mobile
          ? "flex-col justify-center min-w-[4.25rem] shrink-0 px-1 py-2 text-[10px] font-medium"
          : "px-3 py-2 text-sm font-medium",
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
      {badge && !mobile && (
        <span className="ml-auto text-[10px] bg-[#D10069] text-white px-1.5 py-0.5 rounded-full shrink-0">
          {badge}
        </span>
      )}
    </Link>
  );
}

function ShellSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--digi-surface)]">
      <div
        className="hidden md:block fixed inset-y-0 left-0 w-[240px] border-r border-[var(--digi-border)] bg-white/95"
        aria-hidden
      />
      <div className="flex-1 flex flex-col md:pl-[240px] pb-20 md:pb-0 min-w-0">
        <main className="flex-1">{children}</main>
      </div>
    </div>
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
  const [mounted, setMounted] = useState(false);
  const [resolvedAvatar, setResolvedAvatar] = useState(avatarUrl);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const { lang } = useLanguage();
  const t = appCopy(lang);
  const { defaultModel, setDefaultModel } = useDefaultModel();
  const navItems = NAV_ROUTES.map((item) => ({
    href: item.href,
    icon: item.icon,
    badge: "badge" in item ? item.badge : undefined,
    label: t[item.labelKey],
  }));
  const hasInitialized = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setResolvedAvatar(avatarUrl);
    setAvatarBroken(false);
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.avatar_url) {
        setResolvedAvatar(data.avatar_url);
      } else {
        const metadataAvatar = user.user_metadata?.avatar_url;
        if (typeof metadataAvatar === "string" && metadataAvatar.length > 0) {
          setResolvedAvatar(metadataAvatar);
        }
      }
    })();
  }, [avatarUrl]);

  useEffect(() => {
    if (!mounted || hasInitialized.current) return;
    hasInitialized.current = true;
    if (!defaultModel) {
      setDefaultModel(getDefaultModel(isProPlan));
    }
  }, [defaultModel, isProPlan, setDefaultModel, mounted]);

  if (!mounted) {
    return <ShellSkeleton>{children}</ShellSkeleton>;
  }

  return (
    <div className="flex min-h-screen bg-[var(--digi-surface)]">
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-[240px] flex-col border-r border-[var(--digi-border)] bg-white/95 dark:bg-[var(--digi-card)]/95 backdrop-blur-md">
        <div className="px-4 py-4 border-b border-[var(--digi-border)]">
          <div className="flex items-center justify-between gap-2">
            <Link href="/home" className="flex items-center gap-2 min-w-0">
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
          {isAdmin && (
            <Link
              href="/admin"
              prefetch={true}
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-[var(--digi-navy)] dark:hover:text-[var(--digi-dark-fg)] rounded-lg transition-colors"
            >
              <Settings className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t.navAdmin}
            </Link>
          )}
        </nav>
        <DigimytchModelSelector />
        {userName && (
          <div className="px-3 py-3 border-t border-[var(--digi-border)] flex items-center gap-2 min-w-0">
            {resolvedAvatar && !avatarBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolvedAvatar}
                alt=""
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-[var(--digi-border)]"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#030A8C] to-[#D10069] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {userName.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <span className="text-xs font-medium text-[var(--digi-navy)] truncate">
              {userName}
            </span>
          </div>
        )}
        <div className="px-3 py-4 border-t border-[var(--digi-border)]">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <SettingsButton />
            <ThemeToggle />
            <LanguageToggle />
            <LogoutButton iconOnly />
          </div>
        </div>
      </aside>

      <div className="md:hidden fixed top-3 right-3 z-50">
        <NotificationBell />
      </div>

      <div className="flex-1 flex flex-col md:pl-[240px] pb-20 md:pb-0 min-w-0">
        <main className="flex-1">{children}</main>
      </div>

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
  );
}
