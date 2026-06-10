"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOUR_KEY = "digi-guided-tour-done";

const STEPS = [
  {
    element: "[data-tour='home-kpis']",
    title: "Vue d'ensemble",
    description: "CV, offres analysées, score moyen et candidatures actives en un coup d'œil.",
  },
  {
    element: "[data-tour='home-next-step']",
    title: "Prochaine étape",
    description: "L'action prioritaire recommandée selon votre progression.",
  },
  {
    element: "[data-tour='home-modules']",
    title: "Modules Talent Hub",
    description: "Accès rapide au matching, score CV, formations et entretiens IA.",
  },
  {
    element: "[data-tour='nav-jobs']",
    title: "Analyser une offre",
    description: "Collez une annonce LinkedIn ou Rekrute pour obtenir un score ATS personnalisé.",
  },
  {
    element: "[data-tour='nav-entretiens']",
    title: "Simulateur vocal",
    description: "Entretien IA avec micro Chrome + synthèse vocale — idéal pour la soutenance.",
  },
];

export function DigimytchGuidedTour() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const startTour = async () => {
    const { driver } = await import("driver.js");
    await import("driver.js/dist/driver.css");

    const driverObj = driver({
      showProgress: true,
      progressText: "{{current}} / {{total}}",
      nextBtnText: "Suivant",
      prevBtnText: "Précédent",
      doneBtnText: "Terminer",
      steps: STEPS.map((s) => ({
        element: s.element,
        popover: { title: s.title, description: s.description, side: "bottom" as const },
      })),
      onDestroyed: () => {
        localStorage.setItem(TOUR_KEY, "1");
      },
    });

    driverObj.drive();
  };

  if (!ready) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5 border-[var(--digi-accent)]/40 text-[var(--digi-navy)]"
      onClick={() => void startTour()}
    >
      <Play className="h-3.5 w-3.5" aria-hidden />
      Voir la démo
    </Button>
  );
}
