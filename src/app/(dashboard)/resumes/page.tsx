import { getDashboardData } from "@/utils/actions";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { MiniResumePreview } from "@/components/resume/shared/mini-resume-preview";
import { ResumeSortControls } from "@/components/resume/management/resume-sort-controls";
import type { SortOption, SortDirection } from "@/components/resume/management/resume-sort-controls";
import { NewResumeButton } from "@/components/resume/management/new-resume-button";
import { DemoBanner } from "@/components/digimytch/demo-banner";
import { PageGuide } from "@/components/digimytch/page-guide";

const RESUMES_PER_PAGE = 12;

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
  } catch {
    redirect("/home");
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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <DemoBanner />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageGuide
          title="Mes CV"
          description="Créez un CV de base (référence pour le matching), puis des CV sur mesure par offre si besoin."
          steps={[
            "Cliquez sur « Nouveau CV » pour créer votre CV de base.",
            "Renseignez le poste visé et importez le contenu de votre profil.",
            "Ouvrez un CV dans la grille pour l'éditer.",
          ]}
        />
        <div className="flex items-center gap-3 shrink-0">
          <Suspense>
            <ResumeSortControls />
          </Suspense>
          <NewResumeButton profile={profile} baseResumes={baseResumes} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {paginatedResumes.map((resume) => (
          <Link href={`/resumes/${resume.id}`} key={resume.id} className="block">
            <MiniResumePreview
              name={resume.name}
              type={resume.is_base_resume ? "base" : "tailored"}
              target_role={resume.target_role}
              updatedAt={resume.updated_at}
              className="hover:-translate-y-0.5 transition-transform border border-[var(--digi-border)] rounded-lg"
            />
          </Link>
        ))}
      </div>

      {paginatedResumes.length === 0 && (
        <p className="text-center text-sm text-[var(--digi-muted)] py-12 rounded-xl border border-dashed border-[var(--digi-border)]">
          Aucun CV pour l&apos;instant. Utilisez le bouton « Nouveau CV » ci-dessus.
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={`/resumes?page=${page}`}
              className={`px-3 py-1 rounded-md text-sm ${
                page === currentPage
                  ? "bg-[var(--digi-navy)] text-white"
                  : "border border-[var(--digi-border)]"
              }`}
            >
              {page}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
