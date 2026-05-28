"use client";

import { CreateResumeDialog } from "@/components/resume/management/dialogs/create-resume-dialog";
import type { Profile, ResumeSummary } from "@/lib/types";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NewResumeButton({
  profile,
  baseResumes = [],
}: {
  profile: Profile;
  baseResumes?: ResumeSummary[];
}) {
  return (
    <CreateResumeDialog type="base" profile={profile} baseResumes={baseResumes}>
      <Button type="button" className="btn-digi-primary gap-2 rounded-full">
        <Plus className="h-4 w-4" aria-hidden />
        Nouveau CV
      </Button>
    </CreateResumeDialog>
  );
}
