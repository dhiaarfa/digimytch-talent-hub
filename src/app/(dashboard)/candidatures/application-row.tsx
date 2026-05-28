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
import {
  updateJobApplicationStatus,
  deleteJobApplication,
} from "@/utils/actions/applications/actions";

const labels: Record<string, string> = {
  saved: "Enregistrée",
  applied: "Envoyée",
  interview: "Entretien",
  rejected: "Refus",
  accepted: "Acceptée",
};

export function ApplicationRow({ row }: { row: JobApplicationWithJob }) {
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
    <tr className="border-b last:border-0">
      <td className="py-3 pr-2 align-top">
        <div className="font-medium">{row.job.position_title}</div>
        <div className="text-xs text-muted-foreground">{row.job.company_name}</div>
      </td>
      <td className="py-3 pr-2 align-top">
        <Select
          value={row.status}
          onValueChange={onStatusChange}
          disabled={pending}
        >
          <SelectTrigger className="w-[160px] h-9">
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
      </td>
      <td className="py-3 pr-2 align-top text-xs text-muted-foreground whitespace-nowrap">
        {new Date(row.updated_at).toLocaleDateString("fr-FR")}
      </td>
      <td className="py-3 align-top text-right space-x-1">
        {row.resume_id && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/resumes/${row.resume_id}`}>CV</Link>
          </Button>
        )}
        <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete} disabled={pending}>
          Supprimer
        </Button>
      </td>
    </tr>
  );
}
