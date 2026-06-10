"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UseDialogLeaveGuardOptions {
  isBusy: boolean;
  hasDraft: () => boolean;
  onDiscard: () => void;
  busyMessage?: string;
}

export function useDialogLeaveGuard({
  isBusy,
  hasDraft,
  onDiscard,
  busyMessage = "Veuillez patienter, une opération est en cours…",
}: UseDialogLeaveGuardOptions) {
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const resetAndClose = useCallback(() => {
    onDiscard();
    setConfirmDiscardOpen(false);
  }, [onDiscard]);

  const handleOpenChange = useCallback(
    (newOpen: boolean, setOpen: (open: boolean) => void) => {
      if (newOpen) {
        setOpen(true);
        return;
      }
      if (isBusy) {
        toast.message(busyMessage);
        return;
      }
      if (hasDraft()) {
        setConfirmDiscardOpen(true);
        return;
      }
      setOpen(false);
    },
    [isBusy, hasDraft, busyMessage]
  );

  const confirmDiscard = useCallback(
    (setOpen: (open: boolean) => void) => {
      resetAndClose();
      setOpen(false);
    },
    [resetAndClose]
  );

  return {
    confirmDiscardOpen,
    setConfirmDiscardOpen,
    handleOpenChange,
    confirmDiscard,
    resetAndClose,
  };
}
