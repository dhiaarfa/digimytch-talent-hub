"use client";

import { AuthDialog } from "@/components/auth/auth-dialog";
import { SplitContent } from "@/components/ui/split-content";
import { CheckCircle2 } from "lucide-react";

const stats = [
  { value: "1 CV", label: "Profil de référence", icon: "📄", color: "text-violet-700 bg-violet-50" },
  { value: "Score", label: "Matching par offre", icon: "🎯", color: "text-[#D10069] bg-[#D10069]/8" },
  { value: "Catalogue", label: "Formations Digimytch", icon: "📚", color: "text-[#030A8C] bg-[#030A8C]/8" },
  { value: "Suivi", label: "Candidatures & historique", icon: "📋", color: "text-amber-700 bg-amber-50" },
];

export default function FeatureHighlights() {
  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 relative overflow-hidden" id="features">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-violet-700 mb-2">Fonctionnalités</p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
            Une plateforme complète pour votre insertion professionnelle
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
            Du CV optimisé au suivi de candidature, Digimytch Talent Hub accompagne chaque étape avec
            des outils clairs et une IA en français.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white shadow-sm px-4 py-3 min-w-[160px]">
              <span className={`text-2xl w-10 h-10 rounded-lg flex items-center justify-center ${s.color.split(" ")[1]}`}
                aria-hidden>
                {s.icon}
              </span>
              <div className="text-left">
                <p className={`text-xl font-bold leading-none ${s.color.split(" ")[0]}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-20">
          <SplitContent
            imageSrc="/SS Chat.png"
            heading="Assistant CV intelligent"
            description="Structurez votre expérience, améliorez vos formulations et adaptez votre CV aux attentes des recruteurs et des systèmes de tri (ATS)."
            imageOnLeft={false}
            imageOverflowRight
            bulletPoints={[
              "Suggestions en temps réel",
              "Ton professionnel en français",
              "Sections modulaires (expérience, compétences, projets)",
            ]}
          />
          <SplitContent
            imageSrc="/Dashboard Image.png"
            heading="Matching emploi–profil"
            description="Comparez chaque offre à votre CV de référence : score, points forts, écarts, puis une explication IA pour préparer votre candidature."
            imageOnLeft
            bulletPoints={[
              "Score de 0 à 100 par offre",
              "Liste des compétences manquantes",
              "Ajout direct aux candidatures",
            ]}
          />
          <SplitContent
            imageSrc="/SS Score.png"
            heading="Formations ciblées"
            description="Le catalogue Digimytch propose des parcours filtrables ; les recommandations mettent en avant ce qui comble vos écarts."
            imageOnLeft={false}
            imageOverflowRight
            bulletPoints={[
              "Filtres par niveau et organisme",
              "Justification de chaque recommandation",
              "Lien vers le détail de la formation",
            ]}
          />
          <SplitContent
            imageSrc="/SS Cover Letter.png"
            heading="Suivi des candidatures"
            description="Centralisez vos démarches : statuts, dates et historique complet pour ne rien perdre de votre recherche d'emploi."
            imageOnLeft
            bulletPoints={[
              "Statuts : envoyée, entretien, refus, acceptée",
              "Historique horodaté",
              "Lien vers le CV utilisé",
            ]}
          />
        </div>

        <div className="mt-20 text-center rounded-2xl border bg-gradient-to-br from-violet-50 to-white p-8 md:p-12">
          <h3 className="text-2xl md:text-3xl font-bold text-violet-900 mb-3">
            Prêt à structurer votre recherche d&apos;emploi ?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Créez votre compte, importez ou rédigez votre CV, puis explorez le matching, les formations
            et le suivi des candidatures.
          </p>
          <AuthDialog>
            <button
              type="button"
              className="px-8 py-3 rounded-lg bg-violet-700 text-white font-medium hover:bg-violet-800 transition-colors"
            >
              Créer mon compte
            </button>
          </AuthDialog>
          <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" aria-hidden />
            Accès aux fonctions principales du hub Digimytch
          </p>
        </div>
      </div>

      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <AuthDialog>
          <button
            type="button"
            className="w-full py-3 rounded-lg bg-violet-700 text-white font-medium shadow-lg"
          >
            Commencer
          </button>
        </AuthDialog>
      </div>
    </section>
  );
}
