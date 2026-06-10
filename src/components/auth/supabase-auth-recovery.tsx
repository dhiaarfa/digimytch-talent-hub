"use client";

import { useEffect, useRef } from "react";
import {
  clearBrowserSupabaseSession,
  hasSupabaseAuthCookie,
  isSupabaseReachable,
} from "@/lib/supabase-browser-session";
import { resetBrowserClient } from "@/utils/supabase/client";

/**
 * When Docker/Supabase restarts, stale refresh tokens cause "Failed to fetch" loops.
 * Clears local session if API is down or auth refresh cannot complete.
 */
export function SupabaseAuthRecovery() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      const reachable = await isSupabaseReachable();
      if (!reachable) {
        clearBrowserSupabaseSession();
        resetBrowserClient();
        return;
      }

      if (!hasSupabaseAuthCookie()) return;
      // Do not call getSession() here — it triggers token refresh and console noise.
    })();
  }, []);

  return null;
}
