"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPLICATION_STATUSES, type JobApplicationWithJob } from "@/lib/types";
import { formatResumeDate } from "@/lib/utils";
import {
  updateJobApplicationStatus,
  deleteJobApplication,
} from "@/utils/actions/applications/actions";
import { ApplicationHistory } from "@/components/digimytch/application-history";

const labels: Record<string, string> = {
  saved: "Enregistrée",
  applied: "Envoyée",
  interview: "Entretien",
  rejected: "Refus",
  accepted: "Acceptée",
};

export function ApplicationCard({ row }: { row: JobApplicationWithJob }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onStatusChange(value: string) {
    start(async () => {
      await updateJobApplicationStatus({
        applicationId: row.id,
        status: value,
      });
      router.refresh();
    });
  }

  function onDelete() {
    start(async () => {
      await deleteJobApplication(row.id);
      router.refresh();
    });
  }

  return (
    <article className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium leading-tight">{row.job.position_title}</h3>
          <p className="text-sm text-muted-foreground">{row.job.company_name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Dernière mise à jour : {formatResumeDate(row.updated_at)}
          </p>
        </div>
        <Select
          value={row.status}
          onValueChange={onStatusChange}
          disabled={pending}
        >
          <SelectTrigger className="w-full sm:w-[180px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {labels[s] ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {row.resume_id && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/resumes/${row.resume_id}`}>Voir le CV</Link>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={onDelete}
          disabled={pending}
        >
          Supprimer
        </Button>
      </div>

      <ApplicationHistory applicationId={row.id} />
    </article>
  );
}
