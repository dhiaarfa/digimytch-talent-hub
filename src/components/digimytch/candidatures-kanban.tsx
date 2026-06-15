"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { Bookmark, Send, Calendar, CheckCircle, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { addNotification } from "@/components/ui/notification-center";
import type { ApplicationStatus, JobApplicationWithJob } from "@/lib/types";
import { KANBAN_COLUMNS } from "@/lib/digimytch-tunisia";
import { updateJobApplicationStatus } from "@/utils/actions/applications/actions";
import { formatResumeDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { ApplicationHistory } from "@/components/digimytch/application-history";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const COLUMN_ICONS = {
  saved: Bookmark,
  applied: Send,
  interview: Calendar,
  accepted: CheckCircle,
} as const;

type KanbanStatus = (typeof KANBAN_COLUMNS)[number]["id"];

const KANBAN_STATUS_IDS = new Set<string>(KANBAN_COLUMNS.map((c) => c.id));

function isKanbanStatus(status: string): status is KanbanStatus {
  return KANBAN_STATUS_IDS.has(status);
}

function columnDroppableId(status: string) {
  return `column:${status}`;
}

function resolveDropStatus(
  overId: UniqueIdentifier,
  rows: JobApplicationWithJob[]
): KanbanStatus | null {
  const id = String(overId);
  if (isKanbanStatus(id)) {
    return id;
  }
  if (id.startsWith("column:")) {
    const status = id.slice("column:".length);
    if (isKanbanStatus(status)) {
      return status;
    }
  }
  const overApp = rows.find((r) => r.id === id);
  if (overApp && isKanbanStatus(overApp.status)) {
    return overApp.status;
  }
  return null;
}

function CompanyInitials({ title, company }: { title: string; company: string }) {
  const source = (company?.trim() || title?.trim() || "?").split(/\s+/);
  const initials = source
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#030A8C] to-[#D10069] text-white text-xs font-bold flex items-center justify-center shrink-0">
      {initials || "?"}
    </div>
  );
}

function KanbanCard({
  app,
  isDragging,
  onReject,
}: {
  app: JobApplicationWithJob;
  isDragging?: boolean;
  onReject?: () => void;
}) {
  return (
    <article
      className={`rounded-lg border border-[var(--digi-border)] bg-white p-3 shadow-sm space-y-2 ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex gap-2">
        <CompanyInitials title={app.job.position_title} company={app.job.company_name} />
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-sm leading-tight truncate">{app.job.position_title}</h4>
          <p className="text-xs text-[var(--digi-muted)] truncate">{app.job.company_name}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-[var(--digi-muted)]">
        <span>{formatResumeDate(app.updated_at)}</span>
        {onReject && app.status !== "rejected" && (
          <button
            type="button"
            className="text-red-600 hover:underline text-xs"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
          >
            Refuser
          </button>
        )}
      </div>
      <ApplicationHistory applicationId={app.id} />
    </article>
  );
}

function DraggableCard({
  app,
  onReject,
}: {
  app: JobApplicationWithJob;
  onReject: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      <KanbanCard app={app} isDragging={isDragging} onReject={onReject} />
    </div>
  );
}

function DroppableColumn({
  id,
  label,
  color,
  icon: Icon,
  apps,
  onRejectApp,
  isDropTarget,
}: {
  id: string;
  label: string;
  color: string;
  icon: typeof Bookmark;
  apps: JobApplicationWithJob[];
  onRejectApp: (appId: string) => void;
  isDropTarget?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDroppableId(id),
    data: { type: "column", status: id },
  });

  return (
    <div
      className={`flex flex-col min-w-[80vw] sm:min-w-[260px] flex-1 rounded-xl border border-[var(--digi-border)] bg-[var(--digi-surface)] snap-start ${isDropTarget || isOver ? "ring-2 ring-[var(--digi-accent)]" : ""}`}
    >
      <header
        className="flex items-center gap-2 px-3 py-3 border-b border-[var(--digi-border)] rounded-t-xl"
        style={{ borderLeftWidth: 4, borderLeftColor: color }}
      >
        <Icon className="h-4 w-4" style={{ color }} aria-hidden />
        <span className="font-medium text-sm text-[var(--digi-dark)]">{label}</span>
        <span className="ml-auto text-xs bg-white border border-[var(--digi-border)] rounded-full px-2 py-0.5">
          {apps.length}
        </span>
      </header>
      <div ref={setNodeRef} className="p-2 space-y-2 flex-1 min-h-[160px]">
        {apps.length === 0 ? (
          <div className="border-2 border-dashed border-[var(--digi-border)] rounded-lg p-4 text-center">
            <Icon className="h-6 w-6 mx-auto mb-2 opacity-30" style={{ color }} aria-hidden />
            <p className="text-xs text-[var(--digi-muted)] leading-relaxed">
              {id === "saved" &&
                "Ajoutez une offre depuis Analyser une offre, puis déplacez la carte ici."}
              {id === "applied" && "Déplacez ici après avoir envoyé votre candidature."}
              {id === "interview" && "Déplacez ici quand un entretien est planifié."}
              {id === "accepted" && "Déplacez ici lorsque vous recevez une offre."}
            </p>
          </div>
        ) : (
          apps.map((app) => (
            <DraggableCard key={app.id} app={app} onReject={() => onRejectApp(app.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function InterviewModal({
  open,
  onOpenChange,
  company,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  company: string;
}) {
  const template = `Bonjour [Nom], je confirme ma disponibilité pour l'entretien prévu le [Date]. Cordialement, [Votre nom]`;

  function copyTemplate() {
    void navigator.clipboard.writeText(template);
    toast.success("Message copié dans le presse-papiers");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vous êtes en phase d&apos;entretien 🎯</DialogTitle>
        </DialogHeader>
        <ul className="text-sm space-y-2 list-disc pl-5 text-[var(--digi-muted)]">
          <li>Préparer les questions fréquentes pour {company || "ce poste"}</li>
          <li>Réviser votre score pour cette offre (Analyser une offre)</li>
        </ul>
        <p className="text-sm font-medium mt-4">Message de confirmation WhatsApp</p>
        <Textarea readOnly value={template} rows={4} className="text-sm" />
        <Button type="button" onClick={copyTemplate} variant="outline" size="sm">
          Copier le message
        </Button>
        <Button type="button" asChild className="w-full btn-digi-primary mt-2">
          <Link href="/entretiens" onClick={() => onOpenChange(false)}>
            Lancer le simulateur d&apos;entretien IA
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function CandidaturesKanban({ initialRows }: { initialRows: JobApplicationWithJob[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<ApplicationStatus | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [interviewModal, setInterviewModal] = useState<{ open: boolean; company: string }>({
    open: false,
    company: "",
  });
  const [, startTransition] = useTransition();

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const status = event.over ? resolveDropStatus(event.over.id, rows) : null;
      setOverStatus(status);
    },
    [rows]
  );

  const visible = useMemo(
    () => rows.filter((r) => showArchived || r.status !== "rejected"),
    [rows, showArchived]
  );

  const byColumn = useMemo(() => {
    const map: Record<string, JobApplicationWithJob[]> = {
      saved: [],
      applied: [],
      interview: [],
      accepted: [],
    };
    for (const r of visible) {
      if (r.status in map) map[r.status].push(r);
    }
    return map;
  }, [visible]);

  const activeApp = activeId ? rows.find((r) => r.id === activeId) : undefined;

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      setOverStatus(null);
      const { active, over } = event;
      if (!over) return;

      const appId = String(active.id);
      const newStatus =
        resolveDropStatus(over.id, rows) ?? overStatus;
      if (!newStatus) return;

      const prev = rows.find((r) => r.id === appId);
      if (!prev || prev.status === newStatus) return;

      setRows((list) =>
        list.map((r) => (r.id === appId ? { ...r, status: newStatus as typeof r.status } : r))
      );

      startTransition(async () => {
        try {
          await updateJobApplicationStatus({ applicationId: appId, status: newStatus });
          const labels: Record<string, string> = {
            interview: "Entretien",
            applied: "Candidature envoyée",
            saved: "À traiter",
            accepted: "Offre reçue",
            rejected: "Refusée",
          };
          toast.success(`Statut mis à jour : ${labels[newStatus] ?? newStatus}`);
          addNotification({
            type: "info",
            title: "Statut mis à jour",
            message: `Candidature « ${prev.job.position_title} » → ${labels[newStatus] ?? newStatus}`,
            action: { label: "Voir mes candidatures →", href: "/candidatures" },
          });
          if (newStatus === "interview") {
            setInterviewModal({ open: true, company: prev.job.company_name });
          }
          router.refresh();
        } catch {
          setRows((list) =>
            list.map((r) => (r.id === appId ? { ...r, status: prev.status } : r))
          );
          toast.error("Impossible de mettre à jour le statut");
        }
      });
    },
    [rows, router, overStatus]
  );

  const handleReject = useCallback(
    (appId: string) => {
      const prev = rows.find((r) => r.id === appId);
      if (!prev || prev.status === "rejected") return;

      setRows((list) =>
        list.map((r) => (r.id === appId ? { ...r, status: "rejected" as typeof r.status } : r))
      );

      startTransition(async () => {
        try {
          await updateJobApplicationStatus({ applicationId: appId, status: "rejected" });
          toast.success("Candidature archivée (refus)");
          router.refresh();
        } catch {
          setRows((list) =>
            list.map((r) => (r.id === appId ? { ...r, status: prev.status } : r))
          );
          toast.error("Impossible d'archiver la candidature");
        }
      });
    },
    [rows, router]
  );

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3 overflow-x-auto pb-2 opacity-60 pointer-events-none select-none" aria-hidden>
          {KANBAN_COLUMNS.map((col) => {
            const Icon = COLUMN_ICONS[col.id];
            return (
              <div
                key={col.id}
                className="min-w-[140px] flex-1 rounded-xl border border-dashed border-[var(--digi-border)] bg-white/50 p-3"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="h-3.5 w-3.5 text-[var(--digi-muted)]" />
                  <span className="text-[10px] font-semibold text-[var(--digi-muted)] truncate">
                    {col.label}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-10 rounded-lg bg-[var(--digi-surface)] border border-[var(--digi-border)]" />
                  {col.id === "saved" && (
                    <div className="h-8 rounded-lg bg-[var(--digi-surface)]/60 border border-[var(--digi-border)]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <EmptyState
          icon={ClipboardList}
          title="Aucune candidature suivie"
          description="Commencez par analyser une offre, puis ajoutez-la à vos candidatures."
          action={{ label: "Analyser une offre", href: "/jobs" }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? "Masquer archivées" : "Afficher archivées (refus)"}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragOver={handleDragOver}
        onDragCancel={() => {
          setActiveId(null);
          setOverStatus(null);
        }}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory -mx-2 px-2 sm:mx-0 sm:px-0">
          {KANBAN_COLUMNS.map((col) => {
            const Icon = COLUMN_ICONS[col.id];
            return (
              <DroppableColumn
                key={col.id}
                id={col.id}
                label={col.label}
                color={col.color}
                icon={Icon}
                apps={byColumn[col.id] ?? []}
                onRejectApp={handleReject}
                isDropTarget={overStatus === col.id}
              />
            );
          })}
        </div>
        <DragOverlay>
          {activeApp ? <KanbanCard app={activeApp} /> : null}
        </DragOverlay>
      </DndContext>

      <InterviewModal
        open={interviewModal.open}
        onOpenChange={(open) => setInterviewModal((s) => ({ ...s,