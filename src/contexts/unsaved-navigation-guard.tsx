"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { UnsavedChangesDialog } from "@/components/resume/editor/dialogs/unsaved-changes-dialog";

export type NavigationTarget = string | "back";

export interface UnsavedGuardRegistration {
  isBlocking: boolean;
  save: () => Promise<boolean>;
}

interface UnsavedNavigationGuardContextValue {
  register: (registration: UnsavedGuardRegistration | null) => void;
  promptNavigation: (target: NavigationTarget) => void;
  discardAndNavigate: (target: NavigationTarget) => void;
  isBlocking: boolean;
}

const UnsavedNavigationGuardContext =
  createContext<UnsavedNavigationGuardContextValue | null>(null);

function isInternalHref(href: string): boolean {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  if (href.startsWith("/")) return true;
  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

function normalizeHref(href: string): string {
  if (href.startsWith("/")) {
    const url = new URL(href, window.location.origin);
    return url.pathname + url.search;
  }
  const url = new URL(href);
  return url.pathname + url.search;
}

export function UnsavedNavigationGuardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const registrationRef = useRef<UnsavedGuardRegistration | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<NavigationTarget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const historyTrapRef = useRef(false);
  /** Prevents the editor from re-registering blocking while navigation is in flight. */
  const navigatingAwayRef = useRef(false);

  useEffect(() => {
    navigatingAwayRef.current = false;
  }, [pathname]);

  const register = useCallback((registration: UnsavedGuardRegistration | null) => {
    if (navigatingAwayRef.current) {
      registrationRef.current = null;
      setIsBlocking(false);
      return;
    }
    registrationRef.current = registration;
    setIsBlocking(Boolean(registration?.isBlocking));
  }, []);

  const completeNavigation = useCallback(
    (target: NavigationTarget) => {
      navigatingAwayRef.current = true;
      registrationRef.current = null;
      setIsBlocking(false);
      setDialogOpen(false);
      setPendingTarget(null);

      if (target === "back") {
        const hadTrap = historyTrapRef.current;
        historyTrapRef.current = false;
        if (typeof window !== "undefined" && hadTrap) {
          window.history.go(-2);
        } else {
          router.back();
        }
        return;
      }
      historyTrapRef.current = false;
      router.push(target);
    },
    [router]
  );

  const promptNavigation = useCallback(
    (target: NavigationTarget) => {
      const reg = registrationRef.current;
      if (!reg?.isBlocking || navigatingAwayRef.current) {
        if (target === "back") {
          router.back();
        } else {
          router.push(target);
        }
        return;
      }
      setPendingTarget(target);
      setDialogOpen(true);
    },
    [router]
  );

  const discardAndNavigate = useCallback(
    (target: NavigationTarget) => {
      completeNavigation(target);
    },
    [completeNavigation]
  );

  // Intercept in-app link clicks while blocking
  useEffect(() => {
    if (!isBlocking || navigatingAwayRef.current) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!anchor || anchor.hasAttribute("data-skip-unsaved-guard")) return;
      const href = anchor.getAttribute("href");
      if (!href || !isInternalHref(href)) return;

      const path = normalizeHref(href);
      const current = window.location.pathname + window.location.search;
      if (path === current) return;

      event.preventDefault();
      event.stopPropagation();
      promptNavigation(path);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [isBlocking, promptNavigation]);

  // Browser back button
  useEffect(() => {
    if (!isBlocking || navigatingAwayRef.current) {
      historyTrapRef.current = false;
      return;
    }

    if (!historyTrapRef.current) {
      history.pushState({ unsavedGuard: true }, "", window.location.href);
      historyTrapRef.current = true;
    }

    const onPopState = () => {
      if (!registrationRef.current?.isBlocking || navigatingAwayRef.current) return;
      history.pushState({ unsavedGuard: true }, "", window.location.href);
      promptNavigation("back");
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isBlocking, promptNavigation]);

  const handleConfirmLeave = useCallback(() => {
    if (pendingTarget) {
      completeNavigation(pendingTarget);
    }
  }, [pendingTarget, completeNavigation]);

  const handleSaveAndLeave = useCallback(async () => {
    const reg = registrationRef.current;
    if (!reg?.save || !pendingTarget) return;
    setIsSaving(true);
    try {
      const ok = await reg.save();
      if (ok) {
        completeNavigation(pendingTarget);
      }
    } finally {
      setIsSaving(false);
    }
  }, [pendingTarget, completeNavigation]);

  return (
    <UnsavedNavigationGuardContext.Provider
      value={{ register, promptNavigation, discardAndNavigate, isBlocking }}
    >
      {children}
      <UnsavedChangesDialog
        isOpen={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setPendingTarget(null);
        }}
        onConfirm={handleConfirmLeave}
        onSave={handleSaveAndLeave}
        isSaving={isSaving}
      />
    </UnsavedNavigationGuardContext.Provider>
  );
}

export function useUnsavedNavigationGuard(
  isBlocking: boolean,
  save: () => Promise<boolean>
) {
  const ctx = useContext(UnsavedNavigationGuardContext);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (!ctx) return;
    ctx.register({
      isBlocking,
      save: () => saveRef.current(),
    });
    return () => ctx.register(null);
  }, [ctx, isBlocking]);

  return ctx;
}

export function useUnsavedNavigationPrompt() {
  const ctx = useContext(UnsavedNavigationGuardContext);
  if (!ctx) {
    return {
      isBlocking: false,
      promptNavigation: () => {},
      discardAndNavigate: () => {},
    };
  }
  return ctx;
}

/** Link that routes through the unsaved-changes guard when active. */
export function GuardedLink({
  href,
  children,
  className,
  onClick,
  ...rest
}: React.ComponentProps<"a"> & { href: string }) {
  const { promptNavigation, isBlocking } = useUnsavedNavigationPrompt();

  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (isBlocking) {
          e.preventDefault();
          promptNavigation(href.startsWith("/") ? href : normalizeHref(href));
        }
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
