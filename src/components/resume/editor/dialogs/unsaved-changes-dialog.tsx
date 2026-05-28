'use client';

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
import { resumeLabels } from "@/lib/resume-labels";
import { isDigimytchTalentHub } from "@/lib/digimytch-config";

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  onOpenChange,
  onConfirm,
}: UnsavedChangesDialogProps) {
  const L = resumeLabels();

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{L.unsavedChanges}</AlertDialogTitle>
          <AlertDialogDescription>
            {isDigimytchTalentHub()
              ? "Vous avez des modifications non enregistrées. Quitter cette page les perdra."
              : "You have unsaved changes. Are you sure you want to leave? Your changes will be lost."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>{L.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {L.leaveWithoutSaving}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
