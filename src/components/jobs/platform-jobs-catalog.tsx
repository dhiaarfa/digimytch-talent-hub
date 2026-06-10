"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Plus, Sparkles } from "lucide-react";
import { PLATFORM_JOB_CATALOG } from "@/lib/platform-jobs-catalog";
import { adoptPlatformJob } from "@/utils/actions/digimytch/platform-jobs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function PlatformJobsCatalog({ availableSlugs }: { availableSlugs: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const available = PLATFORM_JOB_CATALOG.filter((j) => availableSlugs.includes(j.slug));

  if (available.length === 0) {
    return (
      <Card className="border-[var(--digi-border)] bg-[var(--digi-surface)]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--digi-accent)]" />
            Offres Digimytch
          </CardTitle>
          <CardDescription>
            Vous avez déjà adopté toutes les offres du catalogue. Utilisez « Analyser une offre externe » pour en ajouter d&apos;autres.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleAdopt = (slug: string) => {
    setActiveSlug(slug);
    startTransition(async () => {
      const result = await adoptPlatformJob(slug);
      setActiveSlug(null);
      if (result.ok) {
        toast.success("Offre ajoutée à vos analyses et à Mes candidatures.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border-2 border-[#030A8C]/20 bg-gradient-to-br from-[#030A8C]/5 to-transparent p-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-[var(--digi-navy)] flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#030A8C]" aria-hidden />
          Choisir une offre Digimytch
        </h2>
        <p className="text-sm text-[var(--digi-muted)] mt-1 max-w-2xl">
          Offres pré-sélectionnées sur la plateforme — un clic pour les analyser et obtenir votre score.
          <strong className="text-[var(--digi-dark)]"> Distinct</strong> de l&apos;import d&apos;une annonce externe (LinkedIn, Rekrute…).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {available.map((job) => (
          <Card key={job.slug} className="border-[var(--digi-border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm leading-snug">{job.position_title}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {job.company_name}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[var(--digi-muted)] line-clamp-2 mb-3">{job.description}</p>
              <Button
                type="button"
                size="sm"
                className="btn-digi-primary w-full"
                disabled={pending}
                onClick={() => handleAdopt(job.slug)}
              >
                {pending && activeSlug === job.slug ? (
                  "Ajout…"
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Analyser cette offre
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
