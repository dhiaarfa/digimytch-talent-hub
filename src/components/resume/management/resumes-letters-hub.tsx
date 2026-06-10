"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ResumeSummary } from "@/lib/types";
import { ResumeGridCard } from "@/components/resume/management/resume-grid-card";
import { cn, withBasePath } from "@/lib/utils";
import { FileText, Mail, LayoutGrid } from "lucide-react";

type HubFilter = "all" | "cv" | "letters";

interface ResumesLettersHubProps {
  resumes: ResumeSummary[];
  jobTitlesByResumeId: Record<string, string>;
}

export function ResumesLettersHub({ resumes, jobTitlesByResumeId }: ResumesLettersHubProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<HubFilter>("all");

  const letterResumes = useMemo(
    () => resumes.filter((r) => !r.is_base_resume && r.job_id),
    [resumes]
  );

  const cvResumes = resumes;

  const prefetchEditor = (href: string) => {
    router.prefetch(withBasePath(href));
  };

  const filters: { id: HubFilter; label: string; icon: typeof FileText }[] = [
    { id: "all", label: "Tout", icon: LayoutGrid },
    { id: "cv", label: "CV", icon: FileText },
    { id: "letters", label: "Lettres", icon: Mail },
  ];

  const showCv = filter === "all" || filter === "cv";
  const showLetters = filter === "all" || filter === "letters";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {filters.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
              filter === id
                ? "bg-[var(--digi-navy)] text-white border-[var(--digi-navy)]"
                : "border-[var(--digi-border)] text-[var(--digi-muted)] hover:bg-white"
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {showCv && (
        <section className="space-y-3">
          {filter === "all" && (
            <h2 className="text-sm font-semibold text-[var(--digi-navy)] flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden />
              CV ({cvResumes.length})
            </h2>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cvResumes.map((resume) => (
              <ResumeGridCard
                key={`cv-${resume.id}`}
                resume={resume}
                variant="cv"
                href={`/resumes/${resume.id}`}
                onPrefetch={() => prefetchEditor(`/resumes/${resume.id}`)}
              />
            ))}
          </div>
          {showCv && cvResumes.length === 0 && (
            <p className="text-sm text-[var(--digi-muted)] py-6 text-center border border-dashed rounded-xl">
              Aucun CV. Utilisez « Nouveau CV ».
            </p>
          )}
        </section>
      )}

      {showLetters && (
        <section className="space-y-3">
          {filter === "all" && (
            <h2 className="text-sm font-semibold text-[var(--digi-navy)] flex items-center gap-2">
              <Mail className="h-4 w-4" aria-hidden />
              Lettres de motivation ({letterResumes.length})
            </h2>
          )}
          {letterResumes.length === 0 ? (
            <p className="text-sm text-[var(--digi-muted)] py-6 text-center border border-dashed border-amber-200 rounded-xl bg-amber-50/30">
              Créez d&apos;abord un CV sur mesure lié à une offre, puis « Nouvelle lettre ».
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {letterResumes.map((resume) => (
                <ResumeGridCard
                  key={`letter-${resume.id}`}
                  resume={resume}
                  variant="letter"
                  href={`/resumes/${resume.id}?mode=letter`}
                  jobTitle={jobTitlesByResumeId[resume.id]}
                  onPrefetch={() =>
                    prefetchEditor(`/resumes/${resume.id}?mode=letter`)
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
