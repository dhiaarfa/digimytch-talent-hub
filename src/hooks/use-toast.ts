"use client";

/**
 * Shadcn-compatible toast API backed by Sonner (single notification system).
 */
import * as React from "react";
import { toast as sonnerToast } from "sonner";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type ToastInput = Omit<ToasterToast, "id">;

function nodeToText(value: React.ReactNode | undefined): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string" || typeof value === "number") return String(value);
  return undefined;
}

function toastShadcn({ title, description, variant }: ToastInput) {
  const message = nodeToText(title) ?? "Notification";
  const desc = nodeToText(description);

  const id =
    variant === "destructive"
      ? sonnerToast.error(message, { description: desc })
      : sonnerToast.success(message, { description: desc });

  return {
    id: String(id),
    dismiss: () => sonnerToast.dismiss(id),
    update: (props: ToasterToast) => {
      sonnerToast.dismiss(id);
      return toastShadcn(props);
    },
  };
}

/** @deprecated Prefer sonner directly; kept for legacy imports. */
function useToast() {
  return {
    toasts: [] as ToasterToast[],
    toast: toastShadcn,
    dismiss: () => {
      sonnerToast.dismiss();
    },
  };
}

export { useToast, toastShadcn as toast };
