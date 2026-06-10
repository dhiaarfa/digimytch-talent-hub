"use client";

import { Suspense } from "react";
import { DigimytchNavigationProgress } from "@/components/ui/digimytch-navigation-progress";

export function DigimytchNavigationProgressShell() {
  return (
    <Suspense fallback={null}>
      <DigimytchNavigationProgress />
    </Suspense>
  );
}
