import { getDashboardData } from "@/utils/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdaptJobLauncher } from "@/components/jobs/adapt-job-launcher";
import { ResumeSortControls } from "@/components/resume/management/resume-sort-controls";
import type { SortOption, SortDirection } from "@/components/resume/management/resume-sort-controls";
import { NewResumeButton } from "@/components/resume/management/new-resume-button";
import { TailoredResumeButton } from "@/components/resume/management/tailored-resume-button";
import { NewLetterButton } from "@/components/resume/management/new-letter-button";
import { ResumesLettersHub } from "@/components/resume/management/resumes-letters-hub";
import { DemoBanner } from "@/components/digimytch/demo-banner";
import { PageGuide } from "@/components/digimytch/page-guide";
import { PageLoadError } from "@/components/digimytch/page-load-error";

const RESUMES_PER_PAGE = 24;

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function ResumesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  let data;
  try {
    data = await getDashboardData();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Impossible de charger vos CV.";
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <PageLoadError title="Mes CV & lettres" description={msg} />
      </main>
    );
  }

  if (!data.profile) {
    redirect("/home");
  }

  const { profile, baseResumes, tailoredResumes } = data;
  const allResumes = [...baseResumes, ...tailoredResumes];
  const currentPage = Number(params.page) || 1;
  const sort = (params.sort as SortOption) || "createdAt";
  const direction = (params.direction as SortDirection) || "desc";

  const sortedResumes = [...allResumes].sort((a, b) => {
    const modifier = direction === "asc" ? 1 : -1;
    switch (sort) {
      case "name":
        return modifier * a.name.localeCompare(b.name);
      case "jobTitle":
        return modifier * ((a.target_role || "").localeCompare(b.target_role || "") || 0);
      case "createdAt":
      default:
        return modifier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
  });

  const totalPages = Math.ceil(sortedResumes.length / RESUMES_PER_PAGE);
  const paginatedResumes = sortedResumes.slice(
    (currentPage - 1) * RESUMES_PER_PAGE,
    currentPage * RESUMES_PER_PAGE
  );

  const jobTitlesByResumeId: Record<string, string> = {};
  const jobIds = [...new Set(allResumes.map((r) => r.job_id).filter((id): id is string => Boolean(id)))];
  if (jobIds.length > 0 && profile.user_id) {
    const supabase = await createClient();
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, position_title, company_name")
      .eq("user_id", profile.user_id)
      .in("id", jobIds)
      .is("deleted_at", null);
    const jobMap = new Map(
      (jobs ?? []).map((j) => [
        j.id,
        [j.position_title, j.company_name].filter(Boolean).join(" · "),
      ])
    );
    for (const resume of paginatedResumes) {
      if (resume.job_id && jobMap.has(resume.job_id)) {
        jobTitlesByResumeId[resume.id] = jobMap.get(resume.job_id)!;
      }
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <DemoBanner />
      <Suspense>
        <AdaptJobLauncher profile={profile} baseResumes={baseResumes} />
      </Suspense>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageGuide
          title="Mon CV & lettres"
          description="Gérez vos CV et vos lettres de motivation. Chaque lettre est liée à une offre et à un CV sur mesure."
          steps={[
            "Créez un CV de base, puis un CV sur mesure pour une offre.",
            "Score CV : analysez un CV importé sans ouvrir l'éditeur.",
            "Depuis « Nouvelle lettre », liez offre + CV pour rédiger la lettre.",
          ]}
          action={{ label: "Score CV →", href: "/score-cv" }}
        />
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Suspense>
            <ResumeSortControls />
          </Suspense>
          <NewLetterButton profile={profile} baseResumes={baseResumes} />
          <TailoredResumeButton profile={profile} baseResumes={baseResumes} />
          <NewResumeButton profile={profile} baseResumes={baseResumes} />
        </div>
      </div>

      <ResumesLettersHub
        resumes={paginatedResumes}
        jobTitlesByResumeId={jobTitlesByResumeId}
      />

      {paginatedResumes.length === 0 && (
        <p className="text-center text-sm text-[var(--digi-muted)] py-12 rounded-xl border border-dashed border-[var(--digi-border)]">
          Aucun document pour l&apos;instant. Commencez par « Nouveau CV ».
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <a
              key={page}
              href={`/resumes?page=${page}`}
              className={`px-3 py-1 rounded-md text-sm ${
                page === currentPage
                  ? "bg-[var(--digi-navy)] text-white"
                  : "border border-[var(--digi-border)]"
              }`}
            >
              {page}
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
