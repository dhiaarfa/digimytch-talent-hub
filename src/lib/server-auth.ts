import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { getAuthUserWithTimeout } from "@/lib/supabase-resilience";
import { isDigimytchTalentHub } from "@/lib/digimytch-config";
import { isSupabaseConfigured } from "@/lib/supabase-url";

/** Une seule validation auth par requête serveur (layout + pages + actions RSC). */
export const getCachedAuthUser = cache(async (): Promise<{
  user: User | null;
  unavailable: boolean;
}> => {
  if (!isSupabaseConfigured()) {
    return { user: null, unavailable: true };
  }

  try {
    const supabase = await createClient();

    if (isDigimytchTalentHub()) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        return { user: session?.user ?? null, unavailable: false };
      } catch {
        return { user: null, unavailable: true };
      }
    }

    return getAuthUserWithTimeout(() => supabase.auth.getUser(), 900);
  } catch {
    return { user: null, unavailable: true };
  }
});
