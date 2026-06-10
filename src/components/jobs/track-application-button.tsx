"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { upsertJobApplication } from "@/utils/actions/applications/actions";

export function TrackApplicationButton({
  jobId,
  alreadyTracked = false,
}: {
  jobId: string;
  alreadyTracked?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tracked, setTracked] = useState(alreadyTracked);

  useEffect(() => {
    setTracked(alreadyTracked);
  }, [alreadyTracked]);

  if (tracked) {
    return (
      <Button asChild type="button" size="sm" variant="outline">
        <a href="/candidatures">Voir dans Mes candidatures →</a>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      className="bg-[var(--digi-accent)] hover:opacity-90"
      onClick={() => {
        startTransition(async () => {
          try {
            await upsertJobApplication({ jobId, status: "saved" });
            setTracked(true);
            toast.success("Offre ajoutée — retrouvez-la dans la colonne « À traiter »");
            router.refresh();
          } catch (e) {
            const msg =
              e instanceof Error ? e.message : "Impossible d'ajouter la candidature.";
            toast.error(msg);
          }
        });
      }}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
          Ajout…
        </>
      ) : (
        "Ajouter à Mes candidatures"
      )}
    </Button>
  );
}
