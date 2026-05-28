import { DemoBanner } from "@/components/digimytch/demo-banner";
import { InterviewSimulatorPanel } from "@/components/digimytch/interview-simulator-panel";
import { PageGuide } from "@/components/digimytch/page-guide";
import { PageLoadError } from "@/components/digimytch/page-load-error";
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

  const profileEmpty =
    !setup.profile.work_experience?.length &&
    !setup.profile.education?.length &&
    !setup.profile.skills?.length;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <DemoBanner />
      <PageGuide
        title="Simulateur d'entretien"
        description="Un recruteur IA vous questionne à partir de votre profil (expériences, compétences, formation). Répondez par texte ou au micro, puis obtenez un débrief personnalisé."
        steps={[
          "Complétez votre profil ou votre CV de base pour des questions pertinentes.",
          "Choisissez le poste visé ou une offre enregistrée.",
          "Activez la voix pour entendre les questions et dicter vos réponses (Chrome / Edge).",
        ]}
        action={
          profileEmpty
            ? { label: "Compléter mon profil", href: "/profile" }
            : { label: "Voir mes offres", href: "/jobs" }
        }
      />
      <InterviewSimulatorPanel setup={setup} />
    </main>
  );
}
