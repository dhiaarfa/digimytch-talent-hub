import { OptimizedSubscriptionPage } from "@/components/pricing/optimized-subscription-page";
import { getCachedSubscriptionForSession } from "@/lib/cached-subscription";

export const revalidate = 3600;

interface Profile {
  subscription_plan: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export default async function PlansPage() {
  let profile: Profile | null = null;

  try {
    const { row } = await getCachedSubscriptionForSession();
    if (row) {
      profile = {
        subscription_plan: row.subscription_plan ?? null,
        subscription_status: row.subscription_status ?? null,
        current_period_end: row.current_period_end ?? null,
        trial_end: row.trial_end ?? null,
        stripe_customer_id: row.stripe_customer_id ?? null,
        stripe_subscription_id: row.stripe_subscription_id ?? null,
      };
    }
  } catch (error) {
    console.error("Error fetching subscription status:", error);
  }

  return <OptimizedSubscriptionPage initialProfile={profile} />;
}
