import { DemoBanner } from "@/components/digimytch/demo-banner";
import { CvScoreHub } from "@/components/digimytch/cv-score-hub";
import { PageGuide } from "@/components/digimytch/page-guide";
import { AiPoweredBadge } from "@/components/ui/ai-powered-badge";
import { PageLoadError } from "@/components/digimytch/page-load-error";
import { listBaseResumesForScoring } from "@/utils/actions/resumes/score-standalone";
import { scoreCvCopy } from "@/lib/score-cv-i18n";
import { cookies } from "next/headers";

export default async function ScoreCvPage() {
  const langCookie = (await cookies()).get("digi-lang")?.value;
  const lang = langCookie === "en" ? "en" : "fr";
  const t = scoreCvCopy(lang);

  let baseResumes;
  try {
    baseResumes = await listBaseResumesForScoring();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <PageLoadError title={t.resultsTitle} description={msg} />
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <DemoBanner />
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <AiPoweredBadge />
      </div>
      <PageGuide
        title={lang === "en" ? "CV score" : "Score CV"}
        description={
          lang === "en"
            ? "Get a detailed AI score for your resume — without opening the editor. Import an external CV or use one you already have on the platform."
            : "Obtenez un score CV détaillé par l'IA — sans passer par l'éditeur. Importez un CV externe ou utilisez celui déjà sur la plateforme."
        }
        steps={
          lang === "en"
            ? [
                "Paste your CV or pick an existing base resume.",
                "Optionally add a job posting for alignment scoring.",
                'Click "Analyze my score", then "Generate score" in the results.',
              ]
            : [
                "Collez votre CV ou choisissez un CV de base existant.",
                "Ajoutez une annonce pour le score d'alignement et l'analyse ATS par section.",
                "Cliquez sur « Analyser mon score » — score global + écarts mots-clés ATS ci-dessous.",
              ]
        }
        action={{ label: lang === "en" ? "CV & letters" : "CV & lettres", href: "/resumes" }}
      />
      <CvScoreHub baseResumes={baseResumes} />
    </main>
  );
}
