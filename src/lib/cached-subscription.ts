import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/utils/supabase/server";
import {
  getSubscriptionAccessState,
  type SubscriptionAccessState,
  type SubscriptionSnapshot,
} from "@/lib/subscription-access";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { getCachedAuthUser } from "@/lib/server-auth";

const SUBSCRIPTION_COLUMNS =
  "subscription_plan, subscription_status, current_period_end, trial_end, stripe_subscription_id, stripe_customer_id";

const DIGIMYTCH_PRO_SNAPSHOT: SubscriptionSnapshot = {
  subscription_plan: "pro",
  subscription_status: "active",
};

async function loadSubscriptionRow(userId: string): Promise<SubscriptionSnapshot | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(SUBSCRIPTION_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return null;
  return data;
}

/** Cross-request cache (1 h) — only call from /settings and /subscription. */
export function getSubscriptionRowCached(userId: string) {
  return unstable_cache(
    () => loadSubscriptionRow(userId),
    ["subscription-row", userId],
    { revalidate: 3600, tags: [`subscription-${userId}`] }
  )();
}

export interface CachedSubscriptionBundle {
  row: SubscriptionSnapshot | null;
  access: SubscriptionAccessState;
}

/** Per-request dedupe + optional 1 h data cache for subscription pages. */
export const getCachedSubscriptionForSession = cache(
  async (): Promise<CachedSubscriptionBundle> => {
    const { user } = await getCachedAuthUser();
    if (!user) {
      return { row: null, access: getSubscriptionAccessState(null) };
    }

    if (IS_DIGIMYTCH_TALENT_HUB) {
      return {
        row: DIGIMYTCH_PRO_SNAPSHOT,
        access: getSubscriptionAccessState(DIGIMYTCH_PRO_SNAPSHOT),
      };
    }

    const row = await getSubscriptionRowCached(user.id);
    return { row, access: getSubscriptionAccessState(row) };
  }
);
