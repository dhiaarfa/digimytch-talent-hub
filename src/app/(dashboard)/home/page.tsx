import { redirect } from "next/navigation";
import { Suspense } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProfileRow } from "@/components/dashboard/profile-row";
import { WelcomeDialog } from "@/components/dashboard/welcome-dialog";
import { DigimytchWelcome } from "@/components/digimytch/digimytch-welcome";
import { ApiKeyAlert } from "@/components/dashboard/api-key-alert";
import { type SortOption, type SortDirection } from "@/components/resume/management/resume-sort-controls";
import type { ResumeSummary } from "@/lib/types";
import { ResumesSection } from "@/components/dashboard/resumes-section";
import { getDashboardData } from "@/utils/actions";
import { checkSubscriptionPlan } from "@/utils/actions/stripe/actions";
import { FREE_PLAN_RESUME_LIMITS } from "@/lib/resume-limits";
import { DigimytchHomeStats } from "@/components/digimytch/digimytch-home-stats";
import { OnboardingProgress } from "@/components/digimytch/onboarding-progress";
import { DigimytchHomeStatsSkeleton } from "@/components/digimytch/digimytch-home-stats-skeleton";
import { DemoBanner } from "@/components/digimytch/demo-banner";
import { TalentHubHomeCards } from "@/components/digimytch/talent-hub-home-cards";
import { LoyaltyPointsBadge } from "@/components/digimytch/loyalty-points-badge";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { DigimytchOfflineFallback } from "@/components/digimytch/digimytch-offline-fallback";
import { getCachedAuthUser } from "@/lib/server-auth";






export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  // Check if user is coming from confirmation
  const params = await searchParams;
  // N'ouvrir le dialogue de bienvenue qu'après confirmation e-mail explicite (évite overlay bloquant)
  const isNewSignup =
    params?.type === "signup" &&
    typeof params?.token_hash === "string" &&
    params.token_hash.length > 0;

  // Fetch dashboard data and handle authentication
  const fallbackSubscription = {
    plan: '',
    status: '',
    currentPeriodEnd: '',
    trialEnd: '',
    isTrialing: false,
    hasProAccess: false,
  };

  const digimytch = IS_DIGIMYTCH_TALENT_HUB;
  const offlineMode = params?.offline === "1";

  let data;
  let subscription: Awaited<ReturnType<typeof checkSubscriptionPlan>> = fallbackSubscription;
  try {
    data = await getDashboardData();
    if (!digimytch) {
      subscription = await checkSubscriptionPlan().catch(() => fallbackSubscription);
    } else {
      subscription = { ...fallbackSubscription, hasProAccess: true, plan: "pro" };
    }
    if (!data.profile) {
      if (digimytch) {
        return (
          <div className="p-6">
            <DigimytchOfflineFallback title="Profil introuvable" description="Impossible de charger votre profil. Vérifiez Supabase puis réessayez." />
          </div>
        );
      }
      redirect("/");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const { user, unavailable } = await getCachedAuthUser();

    if (digimytch && (offlineMode || unavailable || message.includes("SUPABASE") || message.includes("DASHBOARD_TIMEOUT"))) {
      return (
        <div className="p-6 min-h-[50vh] flex items-center justify-center">
          <DigimytchOfflineFallback />
        </div>
      );
    }

    if (!user) {
      redirect("/auth/login");
    }
    redirect("/");
  }

  const { profile, baseResumes: unsortedBaseResumes, tailoredResumes: unsortedTailoredResumes } = data;
  const baseResumesCount = unsortedBaseResumes.length;
  const tailoredResumesCount = unsortedTailoredResumes.length;

  // Get sort parameters for both sections
  const baseSort = (params.baseSort as SortOption) || 'createdAt';
  const baseDirection = (params.baseDirection as SortDirection) || 'desc';
  const tailoredSort = (params.tailoredSort as SortOption) || 'createdAt';
  const tailoredDirection = (params.tailoredDirection as SortDirection) || 'desc';

  // Sort function
  function sortResumes(resumes: ResumeSummary[], sort: SortOption, direction: SortDirection) {
    return [...resumes].sort((a, b) => {
      const modifier = direction === 'asc' ? 1 : -1;
      switch (sort) {
        case 'name':
          return modifier * a.name.localeCompare(b.name);
        case 'jobTitle':
          return modifier * ((a.target_role || '').localeCompare(b.target_role || '') || 0);
        case 'createdAt':
        default:
          return modifier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
    });
  }

  // Sort both resume lists
  const baseResumes = sortResumes(unsortedBaseResumes, baseSort, baseDirection);
  const tailoredResumes = sortResumes(unsortedTailoredResumes, tailoredSort, tailoredDirection);
  
  // Check if user has Pro access (paid, canceling-but-active, or trialing)
  const isProPlan = subscription.hasProAccess;

  // Free plan limits
  const canCreateBase = isProPlan || baseResumesCount < FREE_PLAN_RESUME_LIMITS.base;
  const canCreateTailored = isProPlan || tailoredResumesCount < FREE_PLAN_RESUME_LIMITS.tailored;


  // Display a friendly message if no profile exists
  if (!profile) {
    return (
      <main className="min-h-screen p-6 md:p-8 lg:p-10 relative flex items-center justify-center">
        <Card className="max-w-md w-full p-8 bg-white/80 backdrop-blur-xl border-white/40 shadow-2xl">
          <div className="text-center space-y-4">
            <User className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-semibold text-gray-800">Profil introuvable</h2>
            <p className="text-muted-foreground">
              Nous n&apos;avons pas pu charger votre profil. Contactez le support Digimytch si le problème persiste.
            </p>
            <Button asChild className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
              <a href="mailto:support@digimytch.tn">Contacter le support</a>
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className={`min-h-screen relative sm:pb-12 ${digimytch ? "pb-24" : "pb-40"}`}>

      {/* Welcome Dialog for New Signups */}
      <WelcomeDialog isOpen={!!isNewSignup} />
      
      {!digimytch && (
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-sky-50/50 to-violet-50/50" />
      </div>
      )}

      {/* Content */}
      <div className="relative z-10">
      {!digimytch && <ProfileRow profile={profile} />}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="mb-6 space-y-4">
            {digimytch && (
              <>
                <DemoBanner />
                <Suspense fallback={null}>
                  <OnboardingProgress />
                </Suspense>
                <Suspense fallback={<DigimytchHomeStatsSkeleton />}>
                  <DigimytchHomeStats />
                </Suspense>
                <LoyaltyPointsBadge />
              </>
            )}
            {!digimytch && !isProPlan && <ApiKeyAlert variant="upgrade" />}

            {digimytch ? (
              <DigimytchWelcome firstName={profile.first_name} />
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Welcome to your resume dashboard
                </p>
              </div>
            )}

            

            {digimytch && <TalentHubHomeCards />}

            {!digimytch && (
            <div className="">
              <ResumesSection
                type="base"
                resumes={baseResumes}
                profile={profile}
                sortParam="baseSort"
                directionParam="baseDirection"
                currentSort={baseSort}
                currentDirection={baseDirection}
                canCreateMore={canCreateBase}
              />

              <div className="relative py-2">
                <div className="h-px bg-gradient-to-r from-transparent via-purple-300/30 to-transparent" />
              </div>

              <ResumesSection
                type="tailored"
                resumes={tailoredResumes}
                profile={profile}
                sortParam="tailoredSort"
                directionParam="tailoredDirection"
                currentSort={tailoredSort}
                currentDirection={tailoredDirection}
                baseResumes={baseResumes}
                canCreateMore={canCreateTailored}
              />
            </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
