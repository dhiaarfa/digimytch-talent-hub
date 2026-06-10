"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteJob } from "@/utils/actions/jobs/actions";

export function DeleteJobButton({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="h-4 w-4 mr-1" />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle>
          <AlertDialogDescription>
            L&apos;offre « {jobTitle} » et les candidatures liées seront déplacées vers la corbeille
            (récupérables 30 jours).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await deleteJob(jobId);
                  toast.success("Offre supprimée");
                  router.refresh();
                } catch {
                  toast.error("Impossible de supprimer l'offre");
                }
              });
            }}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Suppression…
              </>
            ) : (
              "Supprimer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
