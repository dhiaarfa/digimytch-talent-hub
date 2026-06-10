"use client";

import { TrashHub } from "@/components/trash/trash-hub";
import { listAdminTrash } from "@/utils/actions/trash/actions";

export function AdminTrashTab() {
  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground mb-2">
        Formations supprimées depuis l&apos;onglet Formations. Restauration possible pendant 30 jours.
      </p>
      <TrashHub loadItems={listAdminTrash} />
    </div>
  );
}
