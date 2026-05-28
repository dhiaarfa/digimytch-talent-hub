"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "Comment fonctionne le score de matching ?",
    answer:
      "Le score (0 à 100) compare votre CV de référence aux mots-clés, au titre du poste et aux compétences attendues pour chaque offre. Vous voyez les points forts, les écarts et une explication IA sur demande.",
  },
  {
    question: "Les formations viennent-elles d'Internet ?",
    answer:
      "Non. Le catalogue est géré par Digimytch en base de données. Les recommandations mettent en avant les formations qui comblent vos écarts de compétences détectés sur vos offres.",
  },
  {
    question: "Puis-je suivre mes candidatures ?",
    answer:
      "Oui. Depuis Matching, ajoutez une offre à vos candidatures, puis mettez à jour le statut (enregistrée, envoyée, entretien, refus, acceptée). Chaque changement est enregistré dans un historique.",
  },
  {
    question: "L'assistant IA rédige-t-il en français ?",
    answer:
      "Oui. L'assistant vous aide à structurer et améliorer votre CV en français professionnel. Vous pouvez aussi utiliser vos propres clés API dans les paramètres.",
  },
  {
    question: "Mes données sont-elles protégées ?",
    answer:
      "Chaque compte n'accède qu'à ses propres données (authentification Supabase et règles de sécurité en base). Vos CV et candidatures ne sont pas partagés entre utilisateurs.",
  },
  {
    question: "L'outil est-il payant ?",
    answer:
      "Digimytch Talent Hub est proposé dans le cadre du projet d'insertion professionnelle : l'accès aux fonctions principales (CV, matching, formations, candidatures) est ouvert une fois connecté.",
  },
];

export function FAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-20 px-4 relative overflow-hidden scroll-mt-20"
      id="faq"
      aria-labelledby="faq-heading"
    >
      <div className="relative z-10 max-w-2xl mx-auto text-center mb-10">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-sm text-violet-800 mb-3">
          <HelpCircle className="w-4 h-4" aria-hidden />
          FAQ
        </span>
        <h2
          id="faq-heading"
          className="text-3xl md:text-4xl font-bold tracking-tight text-violet-800"
        >
          Questions fréquentes
        </h2>
        <p className="text-base md:text-lg text-muted-foreground mt-2">
          Tout ce qu&apos;il faut savoir pour démarrer sur Digimytch Talent Hub
        </p>
      </div>

      <motion.div
        className="relative z-10 max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <Accordion type="single" collapsible className="space-y-2">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border rounded-lg px-4 bg-white/80"
            >
              <AccordionTrigger className="text-left text-sm md:text-base font-medium hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
