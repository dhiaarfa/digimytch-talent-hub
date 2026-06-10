"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getJobById } from "@/utils/actions/jobs/actions";
import { CreateTailoredResumeDialog } from "@/components/resume/management/dialogs/create-tailored-resume-dialog";
import type { Job, Profile, ResumeSummary } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

/** Ouvre le flux « CV sur mesure » quand l'utilisateur arrive depuis une offre d'emploi. */
export function AdaptJobLauncher({
  profile,
  baseResumes,
}: {
  profile: Profile;
  baseResumes: ResumeSummary[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const jobId = params.get("adaptJob");
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    getJobById(jobId)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) {
          setLoadError("Offre introuvable ou inaccessible.");
          return;
        }
        setJob(loaded);
        setDialogOpen(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Impossible de charger l'offre.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (!jobId) return null;

  const closeDialog = () => {
    setDialogOpen(false);
    router.replace("/resumes");
  };

  return (
    <>
      <div className="rounded-xl border border-[#030A8C]/30 bg-[#030A8C]/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--digi-navy)]">
            {loading
              ? "Chargement de l'offre…"
              : job
                ? `Adapter votre candidature — ${job.position_title}`
                : "Adapter votre candidature pour cette offre"}
          </p>
          <p className="text-xs text-[var(--digi-muted)] mt-1">
            {loadError ? (
              loadError
            ) : (
              <>
                Créez un <strong>CV sur mesure</strong> lié à l&apos;annonce, puis générez votre{" "}
                <strong>lettre de motivation</strong> dans l&apos;éditeur (onglet Lettre).
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {loading ? (
            <Button type="button" size="sm" disabled className="gap-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Chargement…
            </Button>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                className="btn-digi-primary gap-1"
                disabled={!job || baseResumes.length === 0}
                onClick={() => {
                  if (baseResumes.length === 0) {
                    toast({
                      title: "CV de base requis",
                      description: "Créez d'abord un CV de base avant un CV sur mesure.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setDialogOpen(true);
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Créer CV sur mesure
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1">
                <Link href="/jobs">
                  <Mail className="h-3.5 w-3.5" />
                  Retour aux offres
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {job && baseResumes.length > 0 && (
        <CreateTailoredResumeDialog
          baseResumes={baseResumes}
          profile={profile}
          existingJob={job}
          controlledOpen={dialogOpen}
          onControlledOpenChange={(open) => {
            if (!open) closeDialog();
            else setDialogOpen(true);
          }}
          hideTrigger
        >
          <span className="sr-only">Créer CV sur mesure</span>
        </CreateTailoredResumeDialog>
      )}
    </>
  );
}
