"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/use-language";
import { landingCopy } from "@/lib/landing-i18n";
import {
  UserPlus,
  FileText,
  Target,
  ClipboardList,
  BookOpen,
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

const STEP_ICONS = [UserPlus, FileText, Target, ClipboardList] as const;
const FEATURE_ICONS = [FileText, Target, BookOpen, ClipboardList] as const;

export function HowItWorks() {
  const { lang } = useLanguage();
  const t = landingCopy(lang);
  return (
    <section id="how-it-works" className="digimytch-landing-light py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--digi-dark)] text-center">
          {t.howTitle}
        </h2>
        <p className="text-center text-[var(--digi-muted)] mt-3">{t.howSub}</p>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
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

export function FeaturesGrid() {
  const { lang } = useLanguage();
  const t = landingCopy(lang);
  return (
    <section id="features" className="digimytch-landing-light py-20 bg-[var(--digi-surface)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold text-center text-[var(--digi-dark)]">
          {t.featuresTitle}
        </h2>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.features.map(({ title, desc }, i) => {
            const Icon = FEATURE_ICONS[i] ?? FileText;
            return (
            <div
              key={title}
              className="rounded-xl bg-white border border-[var(--digi-border)] p-6 shadow-[var(--digi-card-shadow)]"
            >
              <Icon className="h-8 w-8 text-[var(--digi-accent)]" aria-hidden />
              <h3 className="font-display font-semibold mt-4 text-[var(--digi-dark)]">{title}</h3>
              <p className="text-sm text-[var(--digi-muted)] mt-2">{desc}</p>
            </div>
          );
          })}
        </div>
      </div>
    </section>
  );
}

export function ScoreBridgePreview() {
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
          Comprenez exactement pourquoi vous matchez — ou non.
        </h2>
        <p className="text-center text-[var(--digi-muted)] mt-3 text-sm">
          Notre algorithme décompose chaque offre et compare avec votre profil.
        </p>
        <div className="mt-10 rounded-xl border border-[var(--digi-border)] bg-white shadow-[var(--digi-card-shadow)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--digi-border)] bg-white">
            <span className="text-xs font-semibold tracking-wide text-[var(--digi-muted)] uppercase">
              Compatibilité avec l&apos;offre
            </span>
            <span className="font-display font-bold text-2xl" style={{ color: scoreColor(score) }}>
              {score} / 100
            </span>
          </div>
          <div className="p-5 space-y-4 text-sm">
            <div>
              <p className="font-medium text-[var(--digi-dark)] mb-2">Compétences reconnues</p>
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
              <p className="font-medium text-[var(--digi-dark)] mb-2">Compétences manquantes</p>
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
              💡 Il vous manque Docker.{" "}
              <Link href="#features" className="text-[var(--digi-accent)] font-medium hover:underline">
                Voir la formation →
              </Link>
            </p>
          </div>
          <div className="px-5 pb-5">
            <AuthDialog defaultTab="signup">
              <Button className="w-full bg-[var(--digi-accent)] hover:opacity-90 text-white gap-2">
                Essayer avec mon profil
                <ArrowRight className="h-4 w-4" />
              </Button>
            </AuthDialog>
          </div>
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  { initials: "A.K.", name: "Aziz K.", role: "Développeur Full Stack — Tunis", quote: "J'ai utilisé Digimytch pour analyser 8 offres en une semaine. Le score de matching m'a fait réaliser que je manquais de Docker. J'ai suivi la formation recommandée et décroché l'entretien.", bg: "var(--digi-navy)" },
  { initials: "M.B.", name: "Mariem B.", role: "Chef de projet — Sfax", quote: "L'assistant IA m'a aidé à reformuler mes expériences de manière beaucoup plus percutante. Mon CV n'a plus rien à voir avec avant.", bg: "var(--digi-accent)" },
  { initials: "S.R.", name: "Sami R.", role: "Étudiant ENSI — Cherche alternance", quote: "Le suivi des candidatures est exactement ce qu'il me fallait. Plus de tableur Excel. Je vois tout en un coup d'œil.", bg: "var(--digi-orange)" },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold text-center text-[var(--digi-dark)]">
          Ils structurent leur recherche avec Digimytch
        </h2>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.initials}
              className="rounded-xl border border-[var(--digi-border)] p-6 bg-[var(--digi-surface)]"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold mb-4"
                style={{ background: t.bg }}
              >
                {t.initials}
              </div>
              <p className="text-amber-500 text-sm mb-2" aria-label="5 étoiles">★★★★★</p>
              <p className="text-sm text-[var(--digi-muted)] leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4">
                <p className="font-semibold text-sm text-[var(--digi-dark)]">{t.name}</p>
                <p className="text-xs text-[var(--digi-muted)]">{t.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  { q: "Comment fonctionne le score de matching ?", a: "Le score (0 à 100) compare votre CV de référence aux mots-clés, au titre du poste et aux compétences attendues pour chaque offre." },
  { q: "Les formations viennent-elles d'Internet ?", a: "Non. Le catalogue est géré par Digimytch en base de données et aligné sur vos écarts de compétences." },
  { q: "Puis-je suivre mes candidatures ?", a: "Oui. Tableau Kanban avec statuts, historique et notes pour chaque démarche." },
  { q: "L'assistant IA rédige-t-il en français ?", a: "Oui. Reformulations professionnelles en français, avec vos propres clés API si vous le souhaitez." },
  { q: "Mes données sont-elles protégées ?", a: "Vos données sont hébergées de manière sécurisée. Vous contrôlez ce que vous partagez dans votre profil." },
  { q: "Est-ce gratuit ?", a: "100 % gratuit pour les candidats. Sans carte bancaire ni abonnement." },
  { q: "Puis-je analyser des offres Rekrute ou LinkedIn ?", a: "Collez le texte de l'offre depuis LinkedIn, Indeed ou Rekrute pour obtenir votre score." },
  { q: "Qu'est-ce que le CIVP ?", a: "Le CIVP est un contrat d'initiation à la vie professionnelle courant en Tunisie — vous pouvez le renseigner dans vos candidatures." },
  { q: "Faut-il un CV de base ?", a: "Oui, le matching utilise votre CV de référence (CV de base) le plus récent." },
  { q: "Comment contacter Digimytch ?", a: "Via le site digimytch.com pour le partenariat institutionnel et le support projet." },
];

export function FAQSection() {
  return (
    <section id="faq" className="digimytch-landing-light py-20 bg-[var(--digi-surface)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold text-center text-[var(--digi-dark)] mb-8">
          Questions fréquentes
        </h2>
        <Accordion type="single" collapsible className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
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
  return (
    <section className="py-20 bg-[var(--digi-navy)] text-white text-center">
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="font-display text-3xl sm:text-4xl font-bold">Explorez le prototype</h2>
        <p className="mt-4 text-white/80">
          Créez un compte de test pour parcourir le flux CV, matching, formations et candidatures.
        </p>
        <div className="mt-8">
          <AuthDialog defaultTab="signup">
            <Button size="lg" className="btn-digi-primary gap-2">
              Accéder à la démo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </AuthDialog>
        </div>
        <p className="mt-4 text-sm text-white/70">
          {PFE_TAGLINE} — usage académique uniquement
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
