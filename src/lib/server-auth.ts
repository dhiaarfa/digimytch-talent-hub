import { cache } from "react";

import type { User } from "@supabase/supabase-js";

import { createClient } from "@/utils/supabase/server";

import { getAuthUserWithTimeout } from "@/lib/supabase-resilience";

import { isDigimytchTalentHub } from "@/lib/digimytch-config";



/** Une seule validation auth par requête serveur (layout + pages + actions RSC). */

export const getCachedAuthUser = cache(async (): Promise<{

  user: User | null;

  unavailable: boolean;

}> => {

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

});

