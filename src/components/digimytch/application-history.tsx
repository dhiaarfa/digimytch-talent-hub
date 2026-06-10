"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, History } from "lucide-react";
import { listApplicationEvents } from "@/utils/actions/applications/actions";
import type { JobApplicationEvent } from "@/lib/types";

const statusLabels: Record<string, string> = {
  saved: "Enregistrée",
  applied: "Envoyée",
  interview: "Entretien",
  rejected: "Refus",
  accepted: "Acceptée",
};

function formatStatus(s: string | null) {
  if (!s) return "—";
  return statusLabels[s] ?? s;
}

export function ApplicationHistory({ applicationId }: { applicationId: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle"
  );
  const [events, setEvents] = useState<JobApplicationEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setStatus("loading");
    setError(null);
    try {
      const data = await listApplicationEvents(applicationId);
      setEvents(data);
      setStatus("success");
    } catch {
      setError("Impossible de charger l'historique.");
      setStatus("error");
    }
  }

  return (
    <div className="mt-2 text-left">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1 text-xs"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={loadHistory}
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <History className="h-3 w-3" />
        )}
        Historique
      </Button>
      {open && status === "loading" && (
        <p className="text-xs text-muted-foreground mt-2 pl-1">Chargement…</p>
      )}
      {open && status === "error" && error && (
        <p className="text-xs text-destructive mt-2 pl-1" role="alert">
          {error}
        </p>
      )}
      {open && status === "success" && (
        <ol className="mt-2 space-y-2 border-l-2 border-violet-200 pl-3 max-w-md">
          {events.length === 0 ? (
            <li className="text-xs text-muted-foreground">Aucun événement enregistré.</li>
          ) : (
            events.map((ev) => (
              <li key={ev.id} className="text-xs">
                <time className="text-muted-foreground block">
                  {new Date(ev.created_at).toLocaleString("fr-FR")}
                </time>
                <span className="font-medium">
                  {formatStatus(ev.from_status)} → {formatStatus(ev.to_status)}
                </span>
                {ev.note && (
                  <span className="block text-muted-foreground">{ev.note}</span>
                )}
              </li>
            ))
          )}
        </ol>
      )}
    </div>
  );
}
