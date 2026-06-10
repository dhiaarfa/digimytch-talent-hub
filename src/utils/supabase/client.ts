import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
let browserClient: SupabaseClient | undefined;
let authRefreshStopped = false;

function isAuthUrl(input: RequestInfo | URL): boolean {
  const href =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  return href.includes("/auth/v1/");
}

const resilientFetch: typeof fetch = async (input, init) => {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
    }
  }
  // Do not clear cookies on transient network blips — that caused false logouts.
  if (isAuthUrl(input)) {
    stopBrowserAuthRefresh();
  }
  throw new Error("SUPABASE_NETWORK_UNAVAILABLE", { cause: lastError });
};

export function stopBrowserAuthRefresh(): void {
  authRefreshStopped = true;
  void browserClient?.auth.stopAutoRefresh();
}

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { fetch: resilientFetch },
        auth: {
          autoRefreshToken: !authRefreshStopped,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    );
  }
  return browserClient;
}

export function resetBrowserClient() {
  browserClient = undefined;
  authRefreshStopped = false;
}
