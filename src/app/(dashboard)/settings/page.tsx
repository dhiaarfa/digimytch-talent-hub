import { SettingsContent } from "@/components/settings/settings-content";
import { createClient } from "@/utils/supabase/server";
import { getCachedSubscriptionForSession } from "@/lib/cached-subscription";
import { isAdminUser } from "@/lib/digimytch-config";

export const revalidate = 3600;

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { row: subscription, access: subscriptionState } =
    await getCachedSubscriptionForSession();

  const isProPlan = subscriptionState.hasProAccess;
  const subscriptionStatus = subscription?.subscription_status ?? "";

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, avatar_url, first_name, last_name")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const meta = user?.user_metadata as Record<string, string | undefined> | undefined;
  const displayName =
    profile?.full_name?.trim() ||
    meta?.full_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    "";

  const profileUser = user
    ? {
        email: user.email ?? "",
        full_name: displayName,
        avatar_url: profile?.avatar_url || meta?.avatar_url || null,
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <main className="pt-4 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
        <SettingsContent
          user={user}
          profileUser={profileUser}
          isProPlan={isProPlan}
          subscriptionStatus={subscriptionStatus}
          subscriptionSnapshot={subscription}
          isAdmin={isAdminUser(user)}
        />
      </main>
    </div>
  );
}
