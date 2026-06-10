"use client";

import { CreateResumeDialog } from "@/components/resume/management/dialogs/create-resume-dialog";
import type { Profile, ResumeSummary } from "@/lib/types";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TailoredResumeButton({
  profile,
  baseResumes,
}: {
  profile: Profile;
  baseResumes: ResumeSummary[];
}) {
  if (baseResumes.length === 0) return null;

  return (
    <CreateResumeDialog type="tailored" profile={profile} baseResumes={baseResumes}>
      <Button type="button" variant="outline" className="gap-2 rounded-full border-[#030A8C]/40">
        <Sparkles className="h-4 w-4" aria-hidden />
        CV sur mesure
      </Button>
    </CreateResumeDialog>
  );
}
