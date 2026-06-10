"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { resumeLabels } from "@/lib/resume-labels";
import { isDigimytchTalentHub } from "@/lib/digimytch-config";

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onSave?: () => void | Promise<void>;
  isSaving?: boolean;
}

export function UnsavedChangesDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  onSave,
  isSaving = false,
}: UnsavedChangesDialogProps) {
  const L = resumeLabels();
  const digi = isDigimytchTalentHub();

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{L.unsavedChanges}</AlertDialogTitle>
          <AlertDialogDescription>
            {digi && "unsavedChangesDescription" in L
              ? (L as { unsavedChangesDescription: string }).unsavedChangesDescription
              : digi
                ? "Vous avez des modifications non enregistrées. Que souhaitez-vous faire avant de quitter cette page ?"
                : "You have unsaved changes. What would you like to do before leaving?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <AlertDialogCancel disabled={isSaving}>{L.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isSaving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {L.leaveWithoutSaving}
          </AlertDialogAction>
          {onSave ? (
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => void onSave()}
              className="bg-[var(--color-primary-blue)] hover:opacity-90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {L.save}
                </>
              ) : (
                (digi ? L.saveAndLeave : L.save)
              )}
            </Button>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
