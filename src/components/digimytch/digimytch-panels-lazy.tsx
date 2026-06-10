"use client";

import dynamic from "next/dynamic";

function PanelSkeleton({ className = "h-64" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-[var(--digi-border)] bg-[var(--digi-card)] ${className}`}
      aria-hidden
    />
  );
}

export const InterviewSimulatorPanelLazy = dynamic(
  () =>
    import("@/components/digimytch/interview-simulator-panel").then((m) => ({
      default: m.InterviewSimulatorPanel,
    })),
  { loading: () => <PanelSkeleton className="h-[520px]" /> }
);

export const CandidaturesKanbanLazy = dynamic(
  () =>
    import("@/components/digimytch/candidatures-kanban").then((m) => ({
      default: m.CandidaturesKanban,
    })),
  { loading: () => <PanelSkeleton className="h-[480px]" /> }
);

export const LinkedInAnalyzerLazy = dynamic(
  () =>
    import("@/components/digimytch/linkedin-analyzer").then((m) => ({
      default: m.LinkedInAnalyzer,
    })),
  { loading: () => <PanelSkeleton className="h-80" /> }
);

export const ATSGapAnalyzerLazy = dynamic(
  () =>
    import("@/components/digimytch/ats-gap-analyzer").then((m) => ({
      default: m.ATSGapAnalyzer,
    })),
  { loading: () => <PanelSkeleton className="h-72" /> }
);
