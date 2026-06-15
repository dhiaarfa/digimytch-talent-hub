import { LinkedInAnalyzerLazy } from "@/components/digimytch/digimytch-panels-lazy";
import { DemoBanner } from "@/components/digimytch/demo-banner";
import { PageGuide } from "@/components/digimytch/page-guide";
import { AiPoweredBadge } from "@/components/ui/ai-powered-badge";

export default function LinkedInPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <DemoBanner />
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <AiPoweredBadge />
      </div>
      <PageGuide
        title="Analyse LinkedIn"
        description="Importez une capture d’écran de votre profil LinkedIn pour obtenir un score, des forces et des recommandations personnalisées."
        steps={[
          "Ouvrez votre profil LinkedIn et faites une capture d’écran.",
          "Déposez l’image ci-dessous (PNG ou JPG).",
          "Appliquez les recommandations pour améliorer votre visibilité.",
        ]}
      />
      <LinkedInAnalyzerLazy />
    </main>
  );
}
