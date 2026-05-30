import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { Footer } from "@/components/layout/footer";
import { AppHeader } from "@/components/layout/app-header";
import { createClient } from "@/utils/supabase/server";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { getSubscriptionAccessState } from "@/lib/subscription-access";
import { isAdminUser, IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { GlobalAssistantLazy } from "@/components/ai/global-assistant-lazy";
import { getRootMetadata } from "@/lib/app-metadata";
import { getAuthUserWithTimeout } from "@/lib/supabase-resilience";
import { DigimytchShell } from "@/components/dashboard/digimytch-shell";
import { ScrollButtons } from "@/components/ui/scroll-to-top";
import { TopProgressBar } from "@/components/ui/progress-bar";

const isVercel = process.env.VERCEL === "1";

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

  const supabase = await createClient();
  const { user } = await getAuthUserWithTimeout(() => supabase.auth.getUser());

  const digimytch = IS_DIGIMYTCH_TALENT_HUB;
  let showUpgradeButton = false;
  let isProPlan = false;
  let upgradeButtonVariant: "trial" | "upgrade" = "upgrade";

  const useDigimytchShell = Boolean(user && digimytch);
  const isAdmin = isAdminUser(user ?? null);

  let shellUserName: string | undefined;
  let shellAvatarUrl: string | undefined;

  if (user) {
    if (digimytch) {
      const [, profileResult] = await Promise.all([
        Promise.resolve(),
        supabase
          .from("profiles")
          .select("full_name, avatar_url, first_name, last_name")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      isProPlan = true;
      showUpgradeButton = false;

      if (useDigimytchShell) {
        const profile = profileResult.data;
        const meta = user.user_metadata as Record<string, string | undefined> | undefined;
        shellUserName =
          profile?.full_name?.trim() ||
          meta?.full_name?.trim() ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
          user.email?.split("@")[0] ||
          "Utilisateur";
        shellAvatarUrl = profile?.avatar_url || meta?.avatar_url;
      }
    } else {
      const [subscriptionResult, profileResult] = await Promise.all([
        (async () => {
          try {
            return await supabase
              .from("subscriptions")
              .select(
                "subscription_plan, subscription_status, current_period_end, trial_end, stripe_subscription_id"
              )
              .eq("user_id", user.id)
              .maybeSingle();
          } catch {
            return { data: null };
          }
        })(),
        useDigimytchShell
          ? supabase
              .from("profiles")
              .select("full_name, avatar_url, first_name, last_name")
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      try {
        const subscriptionState = getSubscriptionAccessState(subscriptionResult.data);
        isProPlan = subscriptionState.hasProAccess;
        showUpgradeButton = !subscriptionState.hasProAccess;
        upgradeButtonVariant = subscriptionState.needsTrial ? "trial" : "upgrade";
      } catch {
        showUpgradeButton = true;
        isProPlan = false;
      }

      if (useDigimytchShell) {
        const profile = profileResult.data;
        const meta = user.user_metadata as Record<string, string | undefined> | undefined;
        shellUserName =
          profile?.full_name?.trim() ||
          meta?.full_name?.trim() ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
          user.email?.split("@")[0] ||
          "Utilisateur";
        shellAvatarUrl = profile?.avatar_url || meta?.avatar_url;
      }
    }
  }

  return (
    <html lang={lang} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${plusJakarta.variable} ${digimytch ? "digimytch-theme" : ""}`}
      >
        <ThemeProvider>
          <TopProgressBar />
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
                {isVercel && <Analytics />}
              </div>
            )}
            {user && !useDigimytchShell && <Footer variant="static" />}
            {useDigimytchShell && isVercel && <Analytics />}
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
        </ThemeProvider>
      </body>
    </html>
  );
}
