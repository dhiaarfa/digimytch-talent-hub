"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  restoreTrashItem,
  permanentlyDeleteTrashItem,
  type TrashItem,
} from "@/utils/actions/trash/actions";
import type { TrashEntityType } from "@/lib/trash";
import { TRASH_ENTITY_LABELS } from "@/lib/trash";

const TYPE_LABELS: Record<TrashEntityType, string> = {
  resume: TRASH_ENTITY_LABELS.resume.fr,
  job: TRASH_ENTITY_LABELS.job.fr,
  application: TRASH_ENTITY_LABELS.application.fr,
  course: TRASH_ENTITY_LABELS.course.fr,
};

export function TrashHub({
  loadItems,
  canPermanentDelete = true,
}: {
  loadItems: () => Promise<TrashItem[]>;
  canPermanentDelete?: boolean;
}) {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await loadItems());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de charger la corbeille.");
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleRestore(item: TrashItem) {
    setBusyId(item.id);
    const result = await restoreTrashItem(item.entityType, item.id);
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Élément restauré.");
    void refresh();
  }

  async function handlePermanentDelete(item: TrashItem) {
    if (
      !confirm(
        `Supprimer définitivement « ${item.label} » ? Cette action est irréversible.`
      )
    ) {
      return;
    }
    setBusyId(item.id);
    const result = await permanentlyDeleteTrashItem(item.entityType, item.id);
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Suppression définitive effectuée.");
    void refresh();
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Chargement de la corbeille…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8">
        La corbeille est vide. Les éléments supprimés restent restaurables pendant 30 jours.
      </p>
    );
  }

  return (
    <ul className="space-y-3 mt-4">
      {items.map((item) => (
        <li
          key={`${item.entityType}-${item.id}`}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4"
        >
          <div className="min-w-0">
            <p className="font-medium truncate">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {TYPE_LABELS[item.entityType]} · supprimé le{" "}
              {new Date(item.deletedAt).toLocaleString("fr-FR")} ·{" "}
              {item.daysRemaining > 0
                ? `${item.daysRemaining} jour(s) restant(s)`
                : "expiration imminente"}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              disabled={busyId === item.id}
              onClick={() => void handleRestore(item)}
            >
              <RotateCcw className="h-4 w-4 mr-1" aria-hidden />
              Restaurer
            </Button>
            {canPermanentDelete && (
              <Button
                size="sm"
                variant="destructive"
                disabled={busyId === item.id}
                onClick={() => void handlePermanentDelete(item)}
              >
                <Trash2 className="h-4 w-4 mr-1" aria-hidden />
                Supprimer
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
