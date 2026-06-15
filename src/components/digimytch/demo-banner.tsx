"use client";

import { useState, useEffect } from "react";
import { Info, X } from "lucide-react";
import { DEMO_BANNER_TEXT, PFE_TAGLINE } from "@/lib/digimytch-branding";

const DISMISS_KEY = "digi-demo-banner-dismissed";

export function DemoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 dark:bg-blue-950/20 dark:border-blue-900/40 px-4 py-3 text-sm animate-fade-in"
    >
      <Info className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" aria-hidden />
      <p className="flex-1 leading-relaxed text-[var(--digi-dark)] dark:text-[var(--digi-dark-fg)]">
        <strong className="font-semibold">{PFE_TAGLINE}</strong>{" "}
        <span className="text-[var(--digi-muted)]">{DEMO_BANNER_TEXT}</span>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 p-0.5 rounded text-[var(--digi-muted)] hover:text-[var(--digi-dark)] hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
