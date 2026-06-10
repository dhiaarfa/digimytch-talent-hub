'use client';

import React from 'react';
import { Resume, Profile, Job } from "@/lib/types";
import { useState, useEffect, useReducer, useRef, useCallback } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ResumeContext, resumeReducer } from './resume-editor-context';
import { createClient } from "@/utils/supabase/client";
import { EditorLayout } from "./layout/EditorLayout";
import { EditorPanel } from './panels/editor-panel';
import { PreviewPanel } from './panels/preview-panel';
import { LetterEditorView } from "./letter-editor-view";
import { useUnsavedNavigationGuard } from '@/contexts/unsaved-navigation-guard';
import { updateResume } from "@/utils/actions/resumes/actions";
import { toast } from "@/hooks/use-toast";
import { resumeLabels, tResume } from "@/lib/resume-labels";

export type ResumeEditorMode = "cv" | "letter";

interface ResumeEditorClientProps {
  initialResume: Resume;
  profile: Profile;
  initialJob?: Job | null;
  defaultTab?: string;
  editorMode?: ResumeEditorMode;
}

export function ResumeEditorClient({
  initialResume,
  profile,
  initialJob,
  defaultTab = "basic",
  editorMode = "cv",
}: ResumeEditorClientProps) {
  const [state, dispatch] = useReducer(resumeReducer, {
    resume: initialResume,
    isSaving: false,
    isDeleting: false,
    hasUnsavedChanges: false
  });

  const baselineRef = useRef(initialResume);
  const debouncedResume = useDebouncedValue(state.resume, 100);
  const [job, setJob] = useState<Job | null>(initialJob ?? null);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const L = resumeLabels();

  useEffect(() => {
    baselineRef.current = initialResume;
  }, [initialResume]);

  const markAsSaved = useCallback(() => {
    baselineRef.current = state.resume;
    dispatch({ type: "SET_HAS_CHANGES", value: false });
  }, [state.resume]);

  const saveChanges = useCallback(async (): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_SAVING', value: true });
      await updateResume(state.resume.id, state.resume);
      markAsSaved();
      toast({
        title: tResume("Changes saved", "Modifications enregistrées"),
        description: L.successSaved,
      });
      return true;
    } catch (error) {
      toast({
        title: tResume("Save failed", "Échec de l'enregistrement"),
        description:
          error instanceof Error
            ? error.message
            : tResume("Unable to save your changes. Please try again.", "Impossible d'enregistrer. Réessayez."),
        variant: "destructive",
      });
      return false;
    } finally {
      dispatch({ type: 'SET_SAVING', value: false });
    }
  }, [state.resume, L.successSaved, markAsSaved]);

  useUnsavedNavigationGuard(state.hasUnsavedChanges, saveChanges);

  // Single job fetching effect
  useEffect(() => {
    if (!state.resume.job_id) {
      setJob(null);
      setIsLoadingJob(false);
      return;
    }

    if (job?.id === state.resume.job_id) {
      return;
    }

    let isCancelled = false;

    async function fetchJob() {
      try {
        setIsLoadingJob(true);
        const supabase = createClient();
        const { data: jobData, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', state.resume.job_id)
          .single();

        if (isCancelled) {
          return;
        }

        if (error) {
          void error;
          setJob(null);
          return;
        }

        setJob(jobData);
      } catch {
        if (!isCancelled) {
          setJob(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingJob(false);
        }
      }
    }

    fetchJob();

    return () => {
      isCancelled = true;
    };
  }, [state.resume.job_id, job?.id]);

  const updateField = <K extends keyof Resume>(field: K, value: Resume[K]) => {
    
    if (field === 'document_settings') {
      if (typeof value === 'object' && value !== null) {
        dispatch({ type: 'UPDATE_FIELD', field, value });
      } else {
        console.error('Invalid document settings:', value);
      }
    } else {
      dispatch({ type: 'UPDATE_FIELD', field, value });
    }
  };

  useEffect(() => {
    const hasChanges =
      JSON.stringify(state.resume) !== JSON.stringify(baselineRef.current);
    dispatch({ type: 'SET_HAS_CHANGES', value: hasChanges });
  }, [state.resume]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.hasUnsavedChanges]);

  const isLetterMode = editorMode === "letter";

  const editorPanel = (
    <EditorPanel
      resume={state.resume}
      profile={profile}
      job={job}
      isLoadingJob={isLoadingJob}
      onResumeChange={updateField}
      defaultTab={defaultTab}
      hideCoverLetter
    />
  );

  const previewPanel = (width: number) => (
    <PreviewPanel
      resume={debouncedResume}
      onResumeChange={updateField}
      width={width}
      showCoverLetter={false}
    />
  );

  return (
    <ResumeContext.Provider value={{ state, dispatch, markAsSaved }}>
      {isLetterMode ? (
        <LetterEditorView
          resume={state.resume}
          job={job}
          isLoadingJob={isLoadingJob}
          containerWidth={720}
          onResumeChange={updateField}
        />
      ) : (
        <EditorLayout
          isBaseResume={state.resume.is_base_resume}
          editorPanel={editorPanel}
          previewPanel={previewPanel}
        />
      )}
    </ResumeContext.Provider>
  );
}
