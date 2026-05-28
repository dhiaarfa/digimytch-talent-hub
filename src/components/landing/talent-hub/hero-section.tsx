"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { PFE_TAGLINE } from "@/lib/digimytch-branding";
import { scoreColor } from "@/lib/score-theme";
import { useLanguage } from "@/lib/use-language";
import { landingCopy } from "@/lib/landing-i18n";

export function HeroSection() {
  const { lang } = useLanguage();
  const t = landingCopy(lang);

  return (
    <section className="digimytch-landing-hero pt-28 pb-20 lg:pt-32 lg:pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white mb-6">
            🇹🇳 {PFE_TAGLINE}
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] text-white">
            {t.heroTitle1}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#ff6eb4]">
              {t.heroTitle2}
            </span>
            <br />
            {t.heroTitle3}
          </h1>
          <p className="mt-6 text-lg text-muted-landing max-w-xl leading-relaxed">{t.heroDesc}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AuthDialog defaultTab="signup">
              <Button size="lg" className="btn-digi-primary gap-2">
                {t.ctaSignup}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </AuthDialog>
            <Button
              asChild
              size="lg"
              className="bg-white text-[var(--digi-navy)] hover:bg-white/90 shadow-md border-0 font-semibold"
            >
              <Link href="#how-it-works">{t.ctaHow}</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-landing">{t.heroBullets}</p>
        </div>

        <div className="relative hidden lg:block">
          <div className="glass-card rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[var(--digi-dark)]">Score Bridge</span>
              <span className={`text-2xl font-bold ${scoreColor(72)}`}>72%</span>
            </div>
            <div className="space-y-3">
              {["React", "TypeScript", "Node.js", "Communication"].map((skill, i) => (
                <div key={skill} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--digi-muted)] w-24">{skill}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#030A8C] to-[#D10069] rounded-full"
                      style={{ width: `${[90, 85, 70, 60][i]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
