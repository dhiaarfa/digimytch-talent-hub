import { getCachedApplications } from "@/lib/digimytch-queries";
import { CandidaturesKanbanLazy } from "@/components/digimytch/digimytch-panels-lazy";
import { DemoBanner } from "@/components/digimytch/demo-banner";
import { PageGuide } from "@/components/digimytch/page-guide";
import { PageLoadError } from "@/components/digimytch/page-load-error";

export default async function CandidaturesPage() {
  let rows;
  try {
    rows = await getCachedApplications();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return (
      <>
        <DemoBanner />
        <PageLoadError
          title="Candidatures indisponibles"
          description={msg}
        />
      </>
    );
  }

  return (
    <main className="max-w-[1400px] mx-auto px-2 sm:px-6 py-6 space-y-5">
      <DemoBanner />
      <div className="px-2 sm:px-0">
      <PageGuide
        title="Mes candidatures"
        description="Suivez chaque démarche. Les cartes arrivent depuis Analyser une offre ; vous les déplacez ensuite entre les colonnes."
        steps={[
          "Sur Analyser une offre, cliquez « Ajouter à Mes candidatures ».",
          "Déplacez la carte : À traiter → Candidature envoyée → Entretien → Offre reçue.",
          "Utilisez « Refuser » sur une carte ou « Afficher archivées » pour les refus.",
        ]}
        action={{ label: "Analyser une offre", href: "/jobs" }}
      />
      </div>
      {/* Mobile swipe hint */}
      <p className="sm:hidden text-xs text-[var(--digi-muted)] text-center flex items-center justify-center gap-1">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
        Glissez horizontalement pour voir toutes les colonnes
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
      </p>
      <CandidaturesKanbanLazy initialRows={rows} />
    </main>
  );
}
