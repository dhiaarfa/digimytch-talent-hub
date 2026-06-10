"use client";

import type { Profile, ResumeSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { CreateTailoredResumeDialog } from "@/components/resume/management/dialogs/create-tailored-resume-dialog";

export function NewLetterButton({
  profile,
  baseResumes,
}: {
  profile: Profile;
  baseResumes: ResumeSummary[];
}) {
  if (baseResumes.length === 0) return null;

  return (
    <CreateTailoredResumeDialog
      profile={profile}
      baseResumes={baseResumes}
      openToLetterMode
    >
      <Button
        type="button"
        variant="outline"
        className="gap-2 rounded-full border-amber-400/60 text-amber-900 hover:bg-amber-50"
      >
        <Mail className="h-4 w-4" aria-hidden />
        Nouvelle lettre
      </Button>
    </CreateTailoredResumeDialog>
  );
}
