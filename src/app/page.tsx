import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { toSafeJsonScript } from "@/lib/html-safety";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider";
import { getAuthUserWithTimeout } from "@/lib/supabase-resilience";
import { LandingNav } from "@/components/landing/talent-hub/landing-nav";
import { HeroSection } from "@/components/landing/talent-hub/hero-section";
import { TrustBanner } from "@/components/landing/talent-hub/trust-banner";
import {
  HowItWorks,
  FeaturesGrid,
  ScoreBridgePreview,
  FAQSection,
  CTABanner,
  LandingFooter,
} from "@/components/landing/talent-hub/sections";

export const metadata: Metadata = {
  title: "Digimytch Talent Hub",
  description:
    "Plateforme tunisienne : CV intelligent, matching emploi–profil, formations et suivi des candidatures.",
};

export default async function Page() {
  const supabase = await createClient();
  const { user, unavailable } = await getAuthUserWithTimeout(() =>
    supabase.auth.getUser()
  );

  if (user) {
    redirect("/home");
  }

  const appName = "Digimytch Talent Hub";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: appName,
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TND",
    },
    description: metadata.description,
    operatingSystem: "Web",
  };

  return (
    <>
      <Script
        id="schema-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toSafeJsonScript(structuredData),
        }}
      />

      <AuthDialogProvider>
        <main className="digimytch-landing min-h-screen">
          <LandingNav />

          {unavailable && (
            <div
              role="alert"
              className="mx-4 sm:mx-6 max-w-3xl mx-auto mt-20 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            >
              <strong className="font-semibold">Base de données hors ligne.</strong>{" "}
              Démarrez Supabase local ou configurez une URL Supabase cloud dans{" "}
              <code className="text-xs">.env</code>.
            </div>
          )}

          <HeroSection />
          <TrustBanner />
          <HowItWorks />
          <FeaturesGrid />
          <ScoreBridgePreview />
          <FAQSection />
          <CTABanner />
          <LandingFooter />
        </main>
      </AuthDialogProvider>
    </>
  );
}
