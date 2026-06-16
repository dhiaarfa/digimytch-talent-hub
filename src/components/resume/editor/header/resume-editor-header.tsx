'use client';

import { Resume } from "@/lib/types";
import { Logo } from "@/components/ui/logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { resumeLabels } from "@/lib/resume-labels";
import { useUnsavedNavigationPrompt } from "@/contexts/unsaved-navigation-guard";
import { useResumeContext } from "@/components/resume/editor/resume-editor-context";
import { updateResume } from "@/utils/actions/resumes/actions";
import { toast } from "@/hooks/use-toast";
import { tResume } from "@/lib/resume-labels";
import { useState } from "react";

interface ResumeEditorHeaderProps {
  resume: Resume;
  hasUnsavedChanges: boolean;
}

export function ResumeEditorHeader({
  resume,
  hasUnsavedChanges,
}: ResumeEditorHeaderProps) {
  const L = resumeLabels();
  const { promptNavigation, discardAndNavigate } = useUnsavedNavigationPrompt();
  const { state, markAsSaved } = useResumeContext();
  const [isSaving, setIsSaving] = useState(false);

  const capitalizeWords = (str: string) => {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleBackClick = () => {
    promptNavigation("/resumes");
  };

  const handleSaveAndLeave = async () => {
    setIsSaving(true);
    try {
      await updateResume(state.resume.id, state.resume);
      markAsSaved();
      toast({
        title: tResume("Changes saved", "Modifications enregistrées"),
        description: L.successSaved,
      });
      discardAndNavigate("/resumes");
    } catch (error) {
      toast({
        title: tResume("Save failed", "Échec de l'enregistrement"),
        description:
          error instanceof Error ? error.message : tResume("Unable to save.", "Impossible d'enregistrer."),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const colors = resume.is_base_resume ? {
    gradient: "from-purple-600 via-purple-500 to-indigo-600",
    border: "border-purple-200/50",
    background: "from-purple-50/95 via-white/95 to-purple-50/95",
    shadow: "shadow-purple-500/10",
    text: "text-purple-600",
    hover: "hover:text-purple-600",
    textOpacity: "text-purple-600/60",
    gradientOverlay: "#f3e8ff30",
  } : {
    gradient: "from-pink-600 via-pink-500 to-rose-600",
    border: "border-pink-200/50",
    background: "from-pink-50/95 via-white/95 to-pink-50/95",
    shadow: "shadow-pink-500/10",
    text: "text-pink-600",
    hover: "hover:text-pink-600",
    textOpacity: "text-pink-600/60",
    gradientOverlay: "#fce7f330",
  };

  const leaveDialog = (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{L.unsavedChanges}</AlertDialogTitle>
        <AlertDialogDescription>
          {"unsavedChangesDescription" in L
            ? (L as { unsavedChangesDescription: string }).unsavedChangesDescription
            : "Vous avez des modifications non enregistrées. Que souhaitez-vous faire avant de quitter cette page ?"}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <AlertDialogCancel disabled={isSaving}>{L.cancel}</AlertDialogCancel>
        <AlertDialogAction
          disabled={isSaving}
          onClick={(e) => {
            e.preventDefault();
            discardAndNavigate("/resumes");
          }}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {L.leaveWithoutSaving}
        </AlertDialogAction>
        <Button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSaveAndLeave()}
          className="bg-[var(--color-primary-blue)] hover:opacity-90"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              {L.save}
            </>
          ) : (
            (L.saveAndLeave)
          )}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  return (
    <div className={cn(
      "h-20 border-b backdrop-blur-xl fixed left-0 right-0 z-40 shadow-lg",
      colors.border,
      `bg-gradient-to-r ${colors.background}`,
      colors.shadow
    )}>
      <div className={cn(
        "absolute inset-0",
        `bg-[linear-gradient(to_right,${colors.gradientOverlay}_0%,#ffffff40_50%,${colors.gradientOverlay}_100%)]`,
        "pointer-events-none"
      )} />
      <div className={cn(
        "absolute inset-0",
        `bg-[radial-gradient(circle_800px_at_50%_-40%,${colors.gradientOverlay}_0%,transparent_100%)]`,
        "pointer-events-none"
      )} />
      <div className={cn(
        "absolute inset-0",
        `bg-[radial-gradient(circle_600px_at_100%_100%,${colors.gradientOverlay}_0%,transparent_100%)]`,
        "pointer-events-none"
      )} />
      
      <div className="max-w-[2000px] mx-auto h-full px-6 flex items-center justify-between relative">
        <div className="flex items-center gap-6">
          {hasUnsavedChanges ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div>
                  <Logo className="text-xl cursor-pointer" asLink={false} />
                </div>
              </AlertDialogTrigger>
              {leaveDialog}
            </AlertDialog>
          ) : (
            <div onClick={handleBackClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && handleBackClick()}>
              <Logo className="text-xl cursor-pointer" asLink={false} />
            </div>
          )}
          <div className="h-8 w-px bg-purple-200/50 hidden sm:block" />
          <div className="flex flex-col justify-center gap-1">
            <div className="flex flex-col ">
              <h1 className="text-xl font-semibold">
                <span className={cn(
                  "bg-gradient-to-r bg-clip-text text-transparent",
                  colors.gradient
                )}>
                  {resume.is_base_resume ? capitalizeWords(resume.target_role) : resume.name}
                </span>
              </h1>
              <div className={cn("flex text-sm", colors.textOpacity)}>
                {resume.is_base_resume ? (
                  <div className="flex items-center">
                    <span className="text-xs font-medium">{L.baseResume}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{L.tailoredResume}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
