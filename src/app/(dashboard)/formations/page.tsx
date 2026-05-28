import { getFormationHubData } from "@/utils/actions/digimytch/actions";
import { FormationsHub } from "@/components/digimytch/formations-hub";
import { DemoBanner } from "@/components/digimytch/demo-banner";
import { PageGuide } from "@/components/digimytch/page-guide";
import { PageLoadError } from "@/components/digimytch/page-load-error";

export default async function FormationsPage() {
  let data;
  try {
    data = await getFormationHubData();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return (
      <>
        <DemoBanner />
        <PageLoadError
          title="Formations indisponibles"
          description={msg}
        />
      </>
    );
  }

  const { courses, ranked, gapUnion } = data;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <DemoBanner />
      <PageGuide
        title="Formations recommandées"
        description="Le catalogue Digimytch met en avant les formations qui comblent vos écarts de compétences détectés sur vos offres analysées."
        steps={[
          "Analysez au moins une offre dans Analyser une offre.",
          "Revenez ici : les formations liées à vos écarts sont signalées.",
          "Filtrez par niveau ou compétence, puis ouvrez le lien externe pour vous inscrire.",
        ]}
        action={{ label: "Analyser une offre", href: "/jobs" }}
      />
      <FormationsHub courses={courses} ranked={ranked} gapUnion={gapUnion} />
    </main>
  );
}
