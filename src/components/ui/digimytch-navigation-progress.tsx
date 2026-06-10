"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  NAV_PROGRESS_HIDE_DELAY_MS,
  NAV_PROGRESS_SAFETY_TIMEOUT_MS,
  NAV_PROGRESS_SHOW_DELAY_MS,
  shouldShowNavProgress,
} from "@/lib/navigation-progress-utils";

export function DigimytchNavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const pendingHref = useRef<string | null>(null);
  const prevPathRef = useRef(pathname);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearShowTimer = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  };

  const hide = useCallback(() => {
    clearShowTimer();
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      pendingHref.current = null;
      hideTimerRef.current = null;
    }, NAV_PROGRESS_HIDE_DELAY_MS);
  }, []);

  const scheduleShow = useCallback(() => {
    clearShowTimer();
    showTimerRef.current = setTimeout(() => {
      setVisible(true);
      showTimerRef.current = null;
    }, NAV_PROGRESS_SHOW_DELAY_MS);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!anchor) return;
      if (anchor.getAttribute("target") === "_blank") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!shouldShowNavProgress(href, pathname)) return;

      pendingHref.current = href;
      scheduleShow();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, scheduleShow]);

  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    hide();
  }, [pathname, searchParams, hide]);

  useEffect(() => {
    if (!visible) return;
    const safety = setTimeout(hide, NAV_PROGRESS_SAFETY_TIMEOUT_MS);
    return () => clearTimeout(safety);
  }, [visible, hide]);

  useEffect(
    () => () => {
      clearShowTimer();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    },
    []
  );

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] h-0.5 overflow-hidden bg-[var(--digi-border,#e2e8f0)]"
      role="progressbar"
      aria-valuetext="Navigation en cours"
    >
      <div className="digimytch-nav-progress-bar h-full w-1/4 bg-gradient-to-r from-[#030A8C] via-[#D10069] to-[#030A8C]" />
    </div>
  );
}
