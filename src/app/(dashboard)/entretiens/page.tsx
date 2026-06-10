import { DemoBanner } from "@/components/digimytch/demo-banner";

import { InterviewSimulatorPanelLazy } from "@/components/digimytch/digimytch-panels-lazy";

import { PageGuide } from "@/components/digimytch/page-guide";

import { PageLoadError } from "@/components/digimytch/page-load-error";

import { AiPoweredBadge } from "@/components/ui/ai-powered-badge";

import { getInterviewSetup } from "@/utils/actions/digimytch/interview-simulator";



export default async function EntretiensPage() {

  let setup;

  try {

    setup = await getInterviewSetup();

  } catch (e) {

    const msg = e instanceof Error ? e.message : "Erreur inconnue";

    return (

      <>

        <DemoBanner />

        <PageLoadError title="Entretiens indisponibles" description={msg} />

      </>

    );

  }



  return (

    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      <DemoBanner />

      <div className="flex flex-wrap items-center gap-2 mb-2">

        <AiPoweredBadge />

      </div>

      <PageGuide

        title="Simulateur d'entretien"

        description={

          setup.isProfileEmpty

            ? "Testez le simulateur vocal sans compléter votre CV : le bouton « Démo rapide » utilise un profil fictif (Alex Martin). Répondez par texte ou au micro, puis obtenez un débrief."

            : "Un recruteur IA vous questionne à partir de votre profil (expériences, compétences, formation). Répondez par texte ou au micro, puis obtenez un débrief personnalisé."

        }

        steps={

          setup.isProfileEmpty

            ? [

                "Cliquez sur « Démo rapide » pour lancer une simulation avec un profil exemple.",

                "Activez la voix pour entendre les questions (Chrome / Edge).",

                "Répondez à au moins une question, puis terminez pour le débrief IA.",

              ]

            : [

                "Choisissez le poste visé ou une offre enregistrée.",

                "Activez la voix pour entendre les questions et dicter vos réponses (Chrome / Edge).",

                "Terminez la simulation pour recevoir un débrief personnalisé.",

              ]

        }

        action={

          setup.isProfileEmpty

            ? { label: "Compléter mon profil", href: "/profile" }

            : { label: "Voir mes offres", href: "/jobs" }

        }

      />

      <InterviewSimulatorPanelLazy setup={setup} />

    </main>

  );

}

