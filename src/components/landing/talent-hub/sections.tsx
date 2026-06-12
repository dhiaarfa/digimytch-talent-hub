"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/use-language";
import { landingCopy } from "@/lib/landing-i18n";
import {
  UserPlus,
  FileText,
  Target,
  Mail,
  ClipboardList,
  BookOpen,
  Linkedin,
  Mic,
  ArrowRight,
} from "lucide-react";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { scoreColor } from "@/lib/score-theme";
import { PFE_AUTHOR, PFE_TAGLINE } from "@/lib/digimytch-branding";

const STEP_ICONS = [UserPlus, FileText, Target, Mail, ClipboardList] as const;
const FEATURE_ICONS = [FileText, Target, Mail, Linkedin, BookOpen, Mic] as const;

export function HowItWorks() {
  const { lang } = useLanguage();
  const t = landingCopy(lang);
  return (
    <section id="how-it-works" className="digimytch-landing-light relative overflow-hidden py-20 bg-white">
      {/* Subtle background: people collaborating in a modern workspace */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80')",
          opacity: 0.045,
        }}
        aria-hidden
      />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--digi-dark)] text-center">
          {t.howTitle}
        </h2>
        <p className="text-center text-[var(--digi-muted)] mt-3">{t.howSub}</p>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-5 gap-8 relative">
          {t.steps.map(({ n, title, desc }, i) => {
            const Icon = STEP_ICONS[i] ?? UserPlus;
            return (
            <article
              key={n}
              className="relative group rounded-xl border border-[var(--digi-border)] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--digi-card-shadow)]"
            >
              {i < t.steps.length - 1 && (
                <span
                  className="hidden lg:block absolute top-12 -right-4 w-8 border-t border-dashed border-[var(--digi-border)]"
                  aria-hidden
                />
              )}
              <span className="text-4xl font-display font-bold text-[var(--digi-navy)]/10">{n}</span>
              <Icon className="h-6 w-6 text-[var(--digi-navy)] mt-2" aria-hidden />
              <h3 className="font-display font-semibold mt-3 text-[var(--digi-dark)]">{title}</h3>
              <p className="text-sm text-[var(--digi-muted)] mt-2 leading-relaxed">{desc}</p>
            </article>
          );
          })}
        </div>
      </div>
    </section>
  );
}

const FEATURE_COLORS = [
  { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
  { bg: "bg-pink-50", icon: "text-pink-600", border: "border-pink-100" },
  { bg: "bg-violet-50", icon: "text-violet-600", border: "border-violet-100" },
  { bg: "bg-cyan-50", icon: "text-cyan-600", border: "border-cyan-100" },
  { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
  { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-100" },
];

export function FeaturesGrid() {
  const { lang } = useLanguage();
  const t = landingCopy(lang);
  return (
    <section id="features" className="digimytch-landing-light py-20 bg-[var(--digi-surface)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--digi-navy)]/8 border border-[var(--digi-navy)]/15 text-[var(--digi-navy)] text-xs font-semibold tracking-wide uppercase mb-4">
            {lang === "en" ? "Features" : "Fonctionnalités"}
          </span>
          <h2 className="font-display text-3xl font-bold text-[var(--digi-dark)]">
            {t.featuresTitle}
          </h2>
          <p className="text-[var(--digi-muted)] mt-2 text-sm max-w-xl mx-auto">
            {lang === "en"
              ? "Every tool you need to stand out, tailored for the Tunisian job market."
              : "Tous les outils pour vous démarquer, pensés pour le marché tunisien."}
          </p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.features.map(({ title, desc }, i) => {
            const Icon = FEATURE_ICONS[i] ?? FileText;
            const color = FEATURE_COLORS[i] ?? FEATURE_COLORS[0];
            return (
              <div
                key={title}
                className="group rounded-2xl bg-white border border-[var(--digi-border)] p-6 shadow-[var(--digi-card-shadow)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl ${color.bg} border ${color.border} flex items-center justify-center mb-4`}>
                  <Icon className={`h-5 w-5 ${color.icon}`} aria-hidden />
                </div>
                <h3 className="font-display font-semibold text-[var(--digi-dark)]">{title}</h3>
                <p className="text-sm text-[var(--digi-muted)] mt-2 leading-relaxed">{desc}</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[var(--digi-navy)]/60 group-hover:text-[var(--digi-navy)] transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {lang === "en" ? "Included" : "Inclus"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ScoreBridgePreview() {
  const { lang } = useLanguage();
  const t = landingCopy(lang);
  const [score, setScore] = useState(0);
  const target = 72;

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setScore(Math.round(target * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const matched = ["PHP", "MySQL", "Symfony", "Git"];
  const missing = ["Docker", "Angular", "CI/CD"];

  return (
    <section className="digimytch-landing-light py-20 bg-[var(--digi-surface)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold text-center text-[var(--digi-dark)]">
          {t.scoreTitle}
        </h2>
        <p className="text-center text-[var(--digi-muted)] mt-3 text-sm">{t.scoreSub}</p>
        <div className="mt-10 rounded-xl border border-[var(--digi-border)] bg-white shadow-[var(--digi-card-shadow)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--digi-border)] bg-white">
            <span className="text-xs font-semibold tracking-wide text-[var(--digi-muted)] uppercase">
              {t.scoreCompatLabel}
            </span>
            <span className="font-display font-bold text-2xl" style={{ color: scoreColor(score) }}>
              {score} / 100
            </span>
          </div>
          <div className="p-5 space-y-4 text-sm">
            <div>
              <p className="font-medium text-[var(--digi-dark)] mb-2">{t.scoreMatched}</p>
              <div className="flex flex-wrap gap-2">
                {matched.map((s, i) => (
                  <span
                    key={`demo-matched-${i}-${s}`}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 animate-fade-in-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="font-medium text-[var(--digi-dark)] mb-2">{t.scoreMissing}</p>
              <div className="flex flex-wrap gap-2">
                {missing.map((s, i) => (
                  <span
                    key={`demo-missing-${i}-${s}`}
                    className="px-2.5 py-1 rounded-full text-xs border border-dashed border-gray-300 text-gray-500 bg-gray-50"
                  >
                    + {s}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-[var(--digi-muted)]">
              Langues : Français ✓ · English B2 requis ⚠
            </p>
            <p className="text-sm bg-[var(--digi-surface)] rounded-lg p-3 border border-[var(--digi-border)]">
              {t.scoreTip}
              <Link href="#features" className="text-[var(--digi-accent)] font-medium hover:underline">
                {t.scoreTipLink}
              </Link>
            </p>
          </div>
          <div className="px-5 pb-5">
            <AuthDialog defaultTab="signup">
              <Button className="w-full bg-[var(--digi-accent)] hover:opacity-90 text-white gap-2">
                {t.scoreCta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </AuthDialog>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  const { lang } = useLanguage();
  const t = landingCopy(lang);
  const items = t.testimonials as Array<{ initials: string; name: string; role: string; stars?: number; quote: string; bg: string }>;
  return (
    <section className="relative overflow-hidden py-20 bg-white">
      {/* Subtle background: team of professionals in a bright office */}
      <div
        className="absolute inset-0 bg-cover bg-top bg-no-repeat pointer-events-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1920&q=80')",
          opacity: 0.04,
        }}
        aria-hidden
      />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold tracking-wide uppercase mb-4">
            ★★★★★&nbsp; {lang === "en" ? "Verified reviews" : "Avis vérifiés"}
          </span>
          <h2 className="font-display text-3xl font-bold text-[var(--digi-dark)]">
            {t.testimonialsTitle}
          </h2>
          <p className="text-[var(--digi-muted)] mt-2 text-sm">
            {lang === "en"
              ? "Real stories from candidates who used Digimytch Talent Hub."
              : "Des témoignages réels de candidats qui utilisent Digimytch Talent Hub."}
          </p>
        </div>

        {/* First row: 3 cards */}
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {items.slice(0, 3).map((item) => (
            <TestimonialCard key={item.initials} item={item} />
          ))}
        </div>
        {/* Second row: 2 cards centered */}
        <div className="mt-5 grid md:grid-cols-2 gap-5 md:max-w-[calc(66.666%+1.25rem)] mx-auto">
          {items.slice(3).map((item) => (
            <TestimonialCard key={item.initials} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ item }: { item: { initials: string; name: string; role: string; stars?: number; quote: string; bg: string } }) {
  const stars = item.stars ?? 5;
  return (
    <blockquote className="group rounded-2xl border border-[var(--digi-border)] p-6 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
      {/* Stars */}
      <p className="text-amber-400 text-sm mb-3" aria-label={`${stars} étoiles`}>
        {"★".repeat(stars)}{"☆".repeat(5 - stars)}
      </p>
      {/* Quote */}
      <p className="text-sm text-[var(--digi-muted)] leading-relaxed flex-1">
        &ldquo;{item.quote}&rdquo;
      </p>
      {/* Author */}
      <footer className="mt-5 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-white shadow-sm"
          style={{ background: item.bg }}
        >
          {item.initials}
        </div>
        <div>
          <p className="font-semibold text-sm text-[var(--digi-dark)]">{item.name}</p>
          <p className="text-xs text-[var(--digi-muted)]">{item.role}</p>
        </div>
        <span className="ml-auto">
          <svg className="w-4 h-4 text-[var(--digi-border)]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
          </svg>
        </span>
      </footer>
    </blockquote>
  );
}

export function FAQSection() {
  const { lang } = useLanguage();
  const t = landingCopy(lang);
  return (
    <section id="faq" className="digimytch-landing-light py-20 bg-[var(--digi-surface)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold text-center text-[var(--digi-dark)] mb-8">
          {t.faqTitle}
        </h2>
        <Accordion type="single" collapsible className="space-y-2">
          {t.faqItems.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-white border border-[var(--digi-border)] rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-[var(--digi-dark)] hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-[var(--digi-muted)]">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function CTABanner() {
  const { lang } = useLanguage();
  const t = landingCopy(lang);

  return (
    <section className="relative overflow-hidden py-20 bg-[var(--digi-navy)] text-white text-center">
      {/* Background: abstract tech/career atmosphere — visible at low opacity on dark navy */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1920&q=80')",
          opacity: 0.14,
        }}
        aria-hidden
      />
      {/* Radial glow in the center for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(209,0,105,0.18) 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative z-10 max-w-2xl mx-auto px-4">
        <h2 className="font-display text-3xl sm:text-4xl font-bold">{t.ctaFinalTitle}</h2>
        <p className="mt-4 text-white/80">{t.ctaFinalDesc}</p>
        <div className="mt-8">
          <AuthDialog defaultTab="signup">
            <Button size="lg" className="btn-digi-primary gap-2">
              {t.ctaFinalBtn}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </AuthDialog>
        </div>
        <p className="mt-4 text-sm text-white/70">
          {PFE_TAGLINE} — {t.ctaFinalNote}
        </p>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--digi-border)] bg-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between gap-4 text-sm text-[var(--digi-muted)]">
        <p className="font-display font-semibold text-[var(--digi-navy)]">Digimytch Talent Hub</p>
        <p>© {new Date().getFullYear()} Digimytch — {PFE_AUTHOR}</p>
      </div>
    </footer>
  );
}
