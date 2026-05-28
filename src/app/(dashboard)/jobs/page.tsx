import { getCachedApplications, getCachedJobsWithMatch } from "@/lib/digimytch-queries";
import { JobsMatchingHub } from "@/components/jobs/jobs-matching-hub";
import { DemoBanner } from "@/components/digimytch/demo-banner";
import { PageLoadError } from "@/components/digimytch/page-load-error";

export default async function JobsMatchingPage() {
  let data;
  let trackedJobIds: string[] = [];
  try {
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

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <DemoBanner />
      <JobsMatchingHub
        resume={resume}
        jobsWithMatch={jobsWithMatch}
        trackedJobIds={trackedJobIds}
      />
    </main>
  );
}
