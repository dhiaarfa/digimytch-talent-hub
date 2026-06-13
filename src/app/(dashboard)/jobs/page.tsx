import { getCachedApplications, getCachedJobsWithMatch } from "@/lib/digimytch-queries";
import { JobsMatchingHub } from "@/components/jobs/jobs-matching-hub";
import { DemoBanner } from "@/components/digimytch/demo-banner";
import { PageLoadError } from "@/components/digimytch/page-load-error";
import { CvRequiredGate } from "@/components/digimytch/cv-required-gate";
import { listPlatformCatalogSlugsForUser } from "@/utils/actions/digimytch/platform-jobs";
import { ensureDemoJobsIfEmpty } from "@/utils/actions/digimytch/seed-demo-jobs";

export default async function JobsMatchingPage() {
  let data;
  let trackedJobIds: string[] = [];
  try {
    await ensureDemoJobsIfEmpty().catch(() => undefined);
    const [jobsData, apps] = await Promise.all([
      getCachedJobsWithMatch(),
      getCachedApplications(),
    ]);
    data = jobsData;
    trackedJobIds = apps.map((a) => a.job_id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return (
      <>
        <DemoBanner />
        <PageLoadError title="Analyse d'offres indisponible" description={msg} />
      </>
    );
  }

  const { resume, jobsWithMatch } = data;
  const availableCatalogSlugs = await listPlatformCatalogSlugsForUser().catch(() => []);

  // Guard: require a base CV before accessing job matching
  if (!resume) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <DemoBanner />
        <CvRequiredGate feature="l'analyse d'offres et du scoring emploi-profil" />
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <DemoBanner />
      <JobsMatchingHub
        resume={resume}
        jobsWithMatch={jobsWithMatch}
        trackedJobIds={trackedJobIds}
        availableCatalogSlugs={availableCatalogSlugs}
      />
    </main>
  );
}
