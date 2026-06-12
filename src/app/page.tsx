import type { Metadata } from "next";
import Script from "next/script";
import { toSafeJsonScript } from "@/lib/html-safety";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider";
import { LandingNav } from "@/components/landing/talent-hub/landing-nav";
import { HeroSection } from "@/components/landing/talent-hub/hero-section";
import { TrustBanner } from "@/components/landing/talent-hub/trust-banner";
import {
  HowItWorks,
  FeaturesGrid,
  TestimonialsSection,
  FAQSection,
  CTABanner,
  LandingFooter,
} from "@/components/landing/talent-hub/sections";

export const metadata: Metadata = {
  title: "Digimytch Talent Hub — CV, lettres IA & matching emploi",
  description:
    "Plateforme tunisienne : CV et lettres de motivation IA, score de matching 0-100, analyse LinkedIn, formations ciblées, candidatures et simulateur d'entretien.",
};

export default async function Page() {
  // Redirection des utilisateurs connectés : middleware (instantané, sans flash landing).
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
    description:
      "CV et lettres IA, matching offres, analyse LinkedIn, formations et suivi candidatures pour le marché tunisien.",
    featureList: [
      "CV et lettres de motivation IA",
      "Score de matching 0-100",
      "Analyse LinkedIn",
      "Formations ciblées",
      "Suivi candidatures et entretiens",
    ].join(", "),
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

          <HeroSection />
          <TrustBanner />
          <HowItWorks />
          <FeaturesGrid />
          <TestimonialsSection />
          <FAQSection />
          <CTABanner />
          <LandingFooter />
        </main>
      </AuthDialogProvider>
    </>
  );
}
