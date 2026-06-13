import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { Footer } from "@/components/layout/footer";
import { AppHeader } from "@/components/layout/app-header";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { isAdminUser, IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { GlobalAssistantLazy } from "@/components/ai/global-assistant-lazy";
import { getRootMetadata } from "@/lib/app-metadata";
import { getCachedAuthUser } from "@/lib/server-auth";
import { DigimytchShell } from "@/components/dashboard/digimytch-shell";
import { ScrollButtons } from "@/components/ui/scroll-to-top";
import { SupabaseSessionGuard } from "@/components/auth/supabase-session-guard";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { DigimytchNavigationProgressShell } from "@/components/ui/digimytch-navigation-progress-shell";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export function generateMetadata(): Metadata {
  return getRootMetadata();
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("digi-lang")?.value;
  const lang = langCookie === "en" ? "en" : "fr";

  const { user } = await getCachedAuthUser();

  const digimytch = IS_DIGIMYTCH_TALENT_HUB;
  const useDigimytchShell = Boolean(user && digimytch);
  const isAdmin = isAdminUser(user ?? null);

  // Subscription is NOT fetched here — only on /settings and /subscription (see cached-subscription.ts).
  const isProPlan = digimytch;
  const showUpgradeButton = false;
  const upgradeButtonVariant: "trial" | "upgrade" = "upgrade";

  let shellUserName: string | undefined;
  let shellAvatarUrl: string | undefined;

  if (user && useDigimytchShell) {
    const meta = user.user_metadata as Record<string, string | undefined> | undefined;
    shellUserName =
      meta?.full_name?.trim() ||
      user.email?.split("@")[0] ||
      "Utilisateur";
    shellAvatarUrl = meta?.avatar_url;
  }

  return (
    <html lang={lang} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${plusJakarta.variable} ${digimytch ? "digimytch-theme" : ""}`}
      >
        <ThemeProvider>
          <SupabaseSessionGuard />
          {digimytch && <DigimytchNavigationProgressShell />}
          <div className="relative min-h-screen flex flex-col">
            {user && !useDigimytchShell && (
              <AppHeader
                showUpgradeButton={showUpgradeButton}
                isProPlan={isProPlan}
                upgradeButtonVariant={upgradeButtonVariant}
              />
            )}
            {useDigimytchShell ? (
              <DigimytchShell
                isProPlan={isProPlan}
                isAdmin={isAdmin}
                userName={shellUserName}
                avatarUrl={shellAvatarUrl}
              >
                {children}
              </DigimytchShell>
            ) : (
              <div className={user ? "py-14 flex-1" : "flex-1"}>
                {children}
              </div>
            )}
            {user && !useDigimytchShell && <Footer variant="static" />}
          </div>
          <Toaster
            richColors
            position="top-right"
            closeButton
            toastOptions={{
              style: {
                fontSize: "1rem",
                padding: "16px",
                minWidth: "400px",
                maxWidth: "500px",
              },
            }}
          />
          {!user && <ScrollButtons />}
          <GlobalAssistantLazy isLoggedIn={!!user} />
          {user && !isAdmin && digimytch && <FeedbackWidget />}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
