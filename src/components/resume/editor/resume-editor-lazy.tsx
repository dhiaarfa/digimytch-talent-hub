"use client";

import dynamic from "next/dynamic";
import type { Job, Profile, Resume } from "@/lib/types";
import { ResumeEditorSkeleton } from "./resume-editor-skeleton";

const ResumeEditorClient = dynamic(
  () =>
    import("./resume-editor-client").then((mod) => ({
      default: mod.ResumeEditorClient,
    })),
  {
    loading: () => <ResumeEditorSkeleton />,
    ssr: false,
  }
);

interface ResumeEditorLazyProps {
  initialResume: Resume;
  profile: Profile;
  initialJob?: Job | null;
}

/** Charge TipTap, panneaux et chat uniquement sur /resumes/[id] */
export function ResumeEditorLazy(props: ResumeEditorLazyProps) {
  return <ResumeEditorClient {...props} />;
}
