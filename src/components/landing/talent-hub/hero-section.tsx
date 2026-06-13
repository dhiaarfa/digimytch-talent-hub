"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { PFE_TAGLINE } from "@/lib/digimytch-branding";
import { useLanguage } from "@/lib/use-language";
import { landingCopy } from "@/lib/landing-i18n";

export function HeroSection() {
  const { lang } = useLanguage();
  const t = landingCopy(lang);

  return (
    <section className="digimytch-landing-hero relative overflow-hidden pt-20 pb-12 lg:pt-24 lg:pb-16">
      {/* Background image — professionals in a modern workspace, tinted by the navy gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80')",
          opacity: 0.12,
        }}
        aria-hidden
      />
      {/* Subtle diagonal lines texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 60px)",
        }}
        aria-hidden
      />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
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
          {/* Feature bullet chips */}
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              lang === "en" ? "CV & AI letters" : "CV & lettres IA",
              lang === "en" ? "Match score 0-100" : "Score matching 0-100",
              lang === "en" ? "LinkedIn analysis" : "Analyse LinkedIn",
              lang === "en" ? "Interview simulator" : "Simulateur d'entretien",
            ].map((label) => (
              <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--digi-accent)] shrink-0" />
                {label}
              </span>
            ))}
          </div>
          {/* Stats row */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">1 200+</span>
              <span className="text-xs text-white/60 leading-tight">{lang === "en" ? "CVs generated" : "CV générés"}</span>
            </div>
            <div className="w-px h-8 bg-white/15 hidden sm:block" aria-hidden />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">98%</span>
              <span className="text-xs text-white/60 leading-tight">{lang === "en" ? "satisfaction" : "satisfaction"}</span>
            </div>
            <div className="w-px h-8 bg-white/15 hidden sm:block" aria-hidden />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-400">{lang === "en" ? "Free" : "Gratuit"}</span>
              <span className="text-xs text-white/60 leading-tight">{lang === "en" ? "for candidates" : "pour les candidats"}</span>
            </div>
          </div>
        </div>

        <div className="relative hidden lg:flex flex-col gap-4">
          {/* Main card — CV match preview */}
          <div className="glass-card rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[var(--digi-navy)] flex items-center justify-center text-white text-xs font-bold shrink-0">Y.M</div>
              <div>
                <p className="text-sm font-semibold text-[var(--digi-dark)]">Yassine M.</p>
                <p className="text-xs text-[var(--digi-muted)]">{lang === "en" ? "Software Engineer" : "Ingénieur logiciel"}</p>
              </div>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                {lang === "en" ? "Match 91%" : "Match 91%"}
              </span>
            </div>
            <div className="space-y-2.5">
              {(lang === "en"
                ? [["React", 92], ["TypeScript", 88], ["Node.js", 75], ["Docker", 40]]
                : [["React", 92], ["TypeScript", 88], ["Node.js", 75], ["Docker", 40]]
              ).map(([skill, pct]) => (
                <div key={skill as string} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--digi-muted)] w-20 shrink-0">{skill as string}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: (pct as number) >= 70
                          ? "linear-gradient(90deg,#030A8C,#D10069)"
                          : "#fbbf24",
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[var(--digi-muted)] w-8 text-right">{pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary card — cover letter preview */}
          <div className="glass-card rounded-xl p-4 shadow-lg flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--digi-accent)]/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-[var(--digi-accent)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--digi-dark)] truncate">
                {lang === "en" ? "✓ Cover letter generated" : "✓ Lettre de motivation générée"}
              </p>
              <p className="text-xs text-[var(--digi-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                {lang === "en"
                  ? "Tailored to your CV and the job offer — live preview, ready to send."
                  : "Adaptée à votre CV et à l'offre — aperçu en direct, prête à envoyer."}
              </p>
            </div>
          </div>

          {/* Floating stat badge */}
          <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 border border-gray-100">
            <span className="text-lg">🎯</span>
            <div>
              <p className="text-xs font-bold text-[var(--digi-dark)]">3 {lang === "en" ? "interviews" : "entretiens"}</p>
              <p className="text-[10px] text-[var(--digi-muted)]">{lang === "en" ? "in 1 week" : "en 1 semaine"}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
