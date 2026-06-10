"use client";

import { useEffect } from "react";
import { createClient, resetBrowserClient, stopBrowserAuthRefresh } from "@/utils/supabase/client";
import { clearBrowserSupabaseSession, isSupabaseReachable } from "@/lib/supabase-browser-session";

/** Stops auth refresh loops when Supabase is down; clears stale cookies. */
export function SupabaseSessionGuard() {
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const cacheKey = "digi-supabase-health";
      const cached = sessionStorage.getItem(cacheKey);
      if (cached === "ok") {
        const supabase = createClient();
        const { data: sub } = supabase.auth.onAuthStateChange((event) => {
          if (event === "SIGNED_OUT") {
            clearBrowserSupabaseSession();
            resetBrowserClient();
          }
        });
        unsubscribe = () => sub.subscription.unsubscribe();
        return;
      }

      const reachable = await isSupabaseReachable(500);
      if (cancelled) return;

      if (reachable) {
        sessionStorage.setItem(cacheKey, "ok");
      } else {
        stopBrowserAuthRefresh();
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.getSession();
      if (cancelled) return;

      if (error?.message?.includes("SUPABASE_NETWORK_UNAVAILABLE")) {
        stopBrowserAuthRefresh();
        sessionStorage.removeItem(cacheKey);
        return;
      }

      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
          clearBrowserSupabaseSession();
          resetBrowserClient();
        }
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return null;
}
