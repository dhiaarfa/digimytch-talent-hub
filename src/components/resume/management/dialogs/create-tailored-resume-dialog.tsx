'use client';
import { logger } from "@/lib/logger";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Profile, ResumeSummary, Job } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Plus, Brain, Copy } from "lucide-react";
import { createTailoredResume, getResumeById } from "@/utils/actions/resumes/actions";
import { CreateBaseResumeDialog } from "./create-base-resume-dialog";
import { tailorResumeToJob } from "@/utils/actions/jobs/ai";
import { formatJobListing } from "@/utils/actions/jobs/ai";
import { createJob } from "@/utils/actions/jobs/actions";
import { MiniResumePreview } from "../../shared/mini-resume-preview";
import { LoadingOverlay, type CreationStep } from "../loading-overlay";
import { BaseResumeSelector } from "../base-resume-selector"; 
import { ImportMethodRadioGroup } from "../import-method-radio-group";
import { JobDescriptionInput } from "../job-description-input";
import { ApiErrorDialog } from "@/components/ui/api-error-dialog";
import { cn, withBasePath } from "@/lib/utils";
import { resumeLabels, tResume } from "@/lib/resume-labels";
import { jobToDescriptionText, jobToSimplifiedListing } from "@/lib/job-listing";
import { selectBestModelForTask, type ApiKey } from "@/lib/ai-models";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";

interface CreateTailoredResumeDialogProps {
  children: React.ReactNode;
  baseResumes?: ResumeSummary[];
  profile?: Profile;
  existingJob?: Job | null;
  controlledOpen?: boolean;
  onControlledOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  /** Après création, ouvre l’éditeur en mode lettre uniquement */
  openToLetterMode?: boolean;
}

function resolveTailorAiConfig() {
  const MODEL_STORAGE_KEY = 'resumelm-default-model';
  const LOCAL_STORAGE_KEY = 'resumelm-api-keys';
  const selectedModel =
    (typeof window !== 'undefined' ? localStorage.getItem(MODEL_STORAGE_KEY) : null) ||
    (IS_DIGIMYTCH_TALENT_HUB ? selectBestModelForTask('cv') : '');
  const storedKeys =
    typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
  let apiKeys: ApiKey[] = [];
  try {
    apiKeys = storedKeys ? JSON.parse(storedKeys) : [];
  } catch {
    apiKeys = [];
  }
  return { model: selectedModel, apiKeys };
}

export function CreateTailoredResumeDialog({
  children,
  baseResumes,
  profile,
  existingJob,
  controlledOpen,
  onControlledOpenChange,
  hideTrigger = false,
  openToLetterMode = false,
}: CreateTailoredResumeDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (isControlled) onControlledOpenChange?.(next);
    else setInternalOpen(next);
  };
  const [selectedBaseResume, setSelectedBaseResume] = useState<string>(baseResumes?.[0]?.id || '');
  const [jobDescription, setJobDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState<CreationStep>('analyzing');
  const [dialogStep, setDialogStep] = useState<1 | 2>(1);
  const [importOption, setImportOption] = useState<'import-profile' | 'ai'>('ai');
  const [isBaseResumeInvalid, setIsBaseResumeInvalid] = useState(false);
  const [isJobDescriptionInvalid, setIsJobDescriptionInvalid] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', description: '' });
  const router = useRouter();
  const L = resumeLabels();

  useEffect(() => {
    if (existingJob && open) {
      setJobDescription(jobToDescriptionText(existingJob));
    }
  }, [existingJob, open]);

  function redactSecrets(text: string) {
    return text
      .replace(/Bearer\s+[^,\s]+/gi, 'Bearer ***')
      .replace(/sk-[a-zA-Z0-9]{8,}/g, 'sk-***')
      .replace(/AIza[0-9A-Za-z\-_]{20,}/g, 'AIza***');
  }

  function getErrorDetails(error: unknown) {
    if (error instanceof Error) return redactSecrets(error.message);
    if (typeof error === 'string') return redactSecrets(error);
    if (!error) return '';
    try {
      return redactSecrets(JSON.stringify(error));
    } catch {
      return '';
    }
  }

  function buildErrorDescription(summary: string, error: unknown) {
    const details = getErrorDetails(error);
    const detailsText = details ? ` Details: ${details}` : '';
    return `${summary}${detailsText}. Contact the developer at hi@alexo.ca for help.`;
  }

  const handleNext = () => {
    if (!selectedBaseResume) {
      setIsBaseResumeInvalid(true);
      toast({
        title: tResume("Required Field Missing", "Champ obligatoire"),
        description: tResume("Please select a base resume to continue.", "Sélectionnez un CV de base pour continuer."),
        variant: "destructive",
      });
      return;
    }
    setDialogStep(2);
  };

  const handleBack = () => {
    setDialogStep(1);
  };

  const handleCreate = async () => {
    // Validate required fields
    if (!selectedBaseResume) {
      setIsBaseResumeInvalid(true);
      toast({
        title: "Error",
        description: "Please select a base resume",
        variant: "destructive",
      });
      return;
    }

    if (!jobDescription.trim() && importOption === 'ai' && !existingJob?.id) {
      setIsJobDescriptionInvalid(true);
      toast({
        title: "Error",
        description: "Please enter a job description",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      setCurrentStep('analyzing');
      
      // Reset validation states
      setIsBaseResumeInvalid(false);
      setIsJobDescriptionInvalid(false);

      // Get model and API key from local storage (Digimytch: OpenRouter gratuit par défaut)
      const { model: selectedModel, apiKeys } = resolveTailorAiConfig();

      // Offre déjà en base (depuis le menu Offres)
      if (existingJob?.id && importOption === 'ai') {
        const formattedJobListing = jobToSimplifiedListing(existingJob);
        setCurrentStep('formatting');

        const { resume: baseResume } = await getResumeById(selectedBaseResume);
        if (!baseResume) throw new Error("Base resume not found");

        setCurrentStep('tailoring');
        let tailoredContent;
        try {
          tailoredContent = await tailorResumeToJob(baseResume, formattedJobListing, {
            model: selectedModel,
            apiKeys,
          });
        } catch (error: Error | unknown) {
          setErrorMessage({
            title: "Erreur",
            description: buildErrorDescription("Échec de l'adaptation IA du CV. Réessayez.", error),
          });
          setShowErrorDialog(true);
          setIsCreating(false);
          return;
        }

        setCurrentStep('finalizing');
        const resume = await createTailoredResume(
          baseResume,
          existingJob.id,
          formattedJobListing.position_title || existingJob.position_title || '',
          formattedJobListing.company_name || existingJob.company_name || '',
          tailoredContent,
        );

        toast({
          title: openToLetterMode ? "Prêt pour votre lettre" : "CV sur mesure créé",
          description: openToLetterMode
            ? "Rédigez votre lettre de motivation pour cette offre."
            : "Votre CV est prêt à être édité.",
        });

        window.location.assign(
          withBasePath(
            `/resumes/${resume.id}${openToLetterMode ? "?mode=letter" : ""}`
          )
        );
        setOpen(false);
        return;
      }

      if (importOption === 'import-profile') {
        // Direct copy logic
        const { resume: baseResume } = await getResumeById(selectedBaseResume);
        if (!baseResume) throw new Error("Base resume not found");

        let jobId: string | null = null;
        let jobTitle = 'Copied Resume';
        let companyName = '';

        if (jobDescription.trim()) {
          // Get model and API key from local storage
          const MODEL_STORAGE_KEY = 'resumelm-default-model';
          const LOCAL_STORAGE_KEY = 'resumelm-api-keys';

          const selectedModel = localStorage.getItem(MODEL_STORAGE_KEY);
          const storedKeys = localStorage.getItem(LOCAL_STORAGE_KEY);
          let apiKeys = [];

          try {
            apiKeys = storedKeys ? JSON.parse(storedKeys) : [];
          } catch (error) {
            logger.error('Error parsing API keys:', error);
          }

          try {
            setCurrentStep('analyzing');
            const formattedJobListing = await formatJobListing(jobDescription, {
              model: selectedModel || '',
              apiKeys
            });

            setCurrentStep('formatting');
            const jobEntry = await createJob(formattedJobListing);
            if (!jobEntry?.id) throw new Error("Failed to create job entry");
            
            jobId = jobEntry.id;
            jobTitle = formattedJobListing.position_title || 'Copied Resume';
            companyName = formattedJobListing.company_name || '';
          } catch (error: Error | unknown) {
            if (error instanceof Error && (
                error.message.toLowerCase().includes('api key') || 
                error.message.toLowerCase().includes('unauthorized') ||
                error.message.toLowerCase().includes('invalid key'))
            ) {
              setErrorMessage({
                title: "API Key Error",
                description: buildErrorDescription(
                  "There was an issue with your API key. Please check your settings and try again",
                  error
                )
              });
            } else {
              setErrorMessage({
                title: "Error",
                description: buildErrorDescription("Failed to process job description. Please try again", error)
              });
            }
            setShowErrorDialog(true);
            setIsCreating(false);
            return;
          }
        }

        const resume = await createTailoredResume(
          baseResume,
          jobId,
          jobTitle,
          companyName,
          {
            work_experience: baseResume.work_experience,
            education: baseResume.education.map(edu => ({
              ...edu,
              gpa: edu.gpa?.toString()
            })),
            skills: baseResume.skills,
            projects: baseResume.projects,
            target_role: baseResume.target_role
          }
        );

        toast({
          title: "Success",
          description: "Resume created successfully",
        });

        router.push(
          `/resumes/${resume.id}${openToLetterMode ? "?mode=letter" : ""}`
        );
        setOpen(false);
        return;
      }

      // 1. Format the job listing
      let formattedJobListing;
      try {
        formattedJobListing = await formatJobListing(jobDescription, {
          model: selectedModel || '',
          apiKeys
        });
      } catch (error: Error | unknown) {
        if (error instanceof Error && (
            error.message.toLowerCase().includes('api key') || 
            error.message.toLowerCase().includes('unauthorized') ||
            error.message.toLowerCase().includes('invalid key'))
        ) {
          setErrorMessage({
            title: "API Key Error",
            description: buildErrorDescription(
              "There was an issue with your API key. Please check your settings and try again",
              error
            )
          });
        } else {
          setErrorMessage({
            title: "Error",
            description: buildErrorDescription("Failed to analyze job description. Please try again", error)
          });
        }
        setShowErrorDialog(true);
        setIsCreating(false);
        return;
      }

      setCurrentStep('formatting');

      // 2. Create job in database and get ID
      const jobEntry = await createJob(formattedJobListing);
      if (!jobEntry?.id) throw new Error("Failed to create job entry");


      // 3. Get the base resume object
      const { resume: baseResume } = await getResumeById(selectedBaseResume);
      if (!baseResume) throw new Error("Base resume not found");

      setCurrentStep('tailoring');

      // 4. Tailor the resume using the formatted job listing
      let tailoredContent;

      try {
        tailoredContent = await tailorResumeToJob(baseResume, formattedJobListing, {
          model: selectedModel || '',
          apiKeys
        });
      } catch (error: Error | unknown) {
        if (error instanceof Error && (
            error.message.toLowerCase().includes('api key') || 
            error.message.toLowerCase().includes('unauthorized') ||
            error.message.toLowerCase().includes('invalid key'))
        ) {
          setErrorMessage({
            title: "API Key Error",
            description: buildErrorDescription(
              "There was an issue with your API key. Please check your settings and try again",
              error
            )
          });
        } else {
          setErrorMessage({
            title: "Error",
            description: buildErrorDescription("Failed to tailor resume. Please try again", error)
          });
        }
        setShowErrorDialog(true);
        setIsCreating(false);
        return;
      }


      setCurrentStep('finalizing');

      
      // 5. Create the tailored resume with job reference
      const resume = await createTailoredResume(
        baseResume,
        jobEntry.id,
        formattedJobListing.position_title || '',
        formattedJobListing.company_name || '',
        tailoredContent,
      );

      toast({
        title: "Success",
        description: "Resume created successfully",
      });

      router.push(
        `/resumes/${resume.id}${openToLetterMode ? "?mode=letter" : ""}`
      );
      setOpen(false);
    } catch (error: unknown) {
      logger.error('Failed to create resume:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create resume",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isCreating) {
      toast({
        title: openToLetterMode ? "Création de la lettre en cours" : "Création en cours",
        description: openToLetterMode
          ? "Veuillez patienter jusqu'à la fin de la préparation de votre lettre."
          : "Veuillez patienter jusqu'à la fin de la création du CV.",
      });
      return;
    }
    setOpen(newOpen);
    if (newOpen) {
      if (existingJob) {
        setJobDescription(jobToDescriptionText(existingJob));
      } else {
        setJobDescription('');
      }
      setDialogStep(1);
      setImportOption('ai');
      setSelectedBaseResume(baseResumes?.[0]?.id || '');
    }
  };

  if (!baseResumes || baseResumes.length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] bg-white border border-gray-200 shadow-lg rounded-lg">
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="p-3 rounded-lg bg-pink-50 border border-pink-100">
              <Sparkles className="w-6 h-6 text-pink-600" />
            </div>
            <div className="text-center space-y-2 max-w-sm">
              <h3 className="font-semibold text-lg text-gray-900">{L.noBaseResumes}</h3>
              <p className="text-sm text-gray-600">{L.noBaseResumesDesc}</p>
            </div>
            {profile ? (
              <CreateBaseResumeDialog profile={profile}>
                <Button className="mt-2 bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  {L.newBaseResume}
                </Button>
              </CreateBaseResumeDialog>
            ) : (
              <Button disabled className="mt-2">
                No profile available to create base resume
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {!hideTrigger && (
          <DialogTrigger asChild>
            {children}
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-[800px] p-0 max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-lg">
          <style jsx global>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
              20%, 40%, 60%, 80% { transform: translateX(2px); }
            }
            .shake {
              animation: shake 0.8s cubic-bezier(.36,.07,.19,.97) both;
            }
          `}</style>
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-50 border border-pink-100">
                <Sparkles className="w-5 h-5 text-pink-600" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {L.createTailoredResume}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  {dialogStep === 1 ? L.chooseBaseResume : L.configureJobDetails}
                </DialogDescription>
              </div>
              {/* Step indicator */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                  dialogStep >= 1 ? "bg-pink-600 text-white" : "bg-gray-200 text-gray-600"
                )}>
                  1
                </div>
                <div className={cn(
                  "w-4 h-0.5",
                  dialogStep >= 2 ? "bg-pink-600" : "bg-gray-200"
                )} />
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                  dialogStep >= 2 ? "bg-pink-600 text-white" : "bg-gray-200 text-gray-600"
                )}>
                  2
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-2 min-h-[400px] relative">
            {isCreating && (
              <LoadingOverlay
                currentStep={currentStep}
                variant={openToLetterMode ? "letter" : "resume"}
              />
            )}
            
            {dialogStep === 1 && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 mb-1">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{tResume("Choose Your Foundation", "Choisissez votre base")}</h3>
                  <p className="text-gray-600 max-w-sm mx-auto text-sm">
                    {tResume("Select a base resume to tailor for this job opportunity.", "Sélectionnez le CV de base à adapter à cette offre.")}
                  </p>
                </div>
                
                {/* Resume Selector */}
                <div className="space-y-4">
                  <BaseResumeSelector
                    baseResumes={baseResumes}
                    selectedResumeId={selectedBaseResume}
                    onResumeSelect={setSelectedBaseResume}
                    isInvalid={isBaseResumeInvalid}
                  />
                </div>

              </div>
            )}

            {dialogStep === 2 && (
              <div className="space-y-6">

                {/* Selected Resume Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <MiniResumePreview
                        name={baseResumes.find(r => r.id === selectedBaseResume)?.name || ''}
                        type="base"
                        className="w-10 h-10"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-purple-900">{tResume("Foundation:", "Base :")}</span>
                        <span className="text-sm text-purple-700 font-semibold truncate">
                          {baseResumes.find(r => r.id === selectedBaseResume)?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Description Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center">
                      <span className="text-pink-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{tResume("Job Information", "Informations sur l'offre")} <span className="text-red-500">*</span></h4>
                      <p className="text-xs text-gray-600">{tResume("Paste the job posting details", "Collez le texte de l'offre d'emploi")}</p>
                    </div>
                  </div>
                  
                  <div className="ml-10">
                    <JobDescriptionInput
                      value={jobDescription}
                      onChange={setJobDescription}
                      isInvalid={isJobDescriptionInvalid}
                    />
                  </div>
                </div>

                {/* Tailoring Method Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center">
                      <span className="text-pink-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{tResume("Tailoring Method", "Méthode d'adaptation")}</h4>
                      <p className="text-xs text-gray-600">{tResume("Choose your customization approach", "Choisissez comment adapter le CV")}</p>
                    </div>
                  </div>
                  
                  <div className="ml-10">
                    <ImportMethodRadioGroup
                      value={importOption}
                      onChange={setImportOption}
                    />
                  </div>
                </div>

                {/* Method Description */}
                {importOption === 'ai' && (
                  <div className="ml-10 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Brain className="w-3 h-3 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-medium text-blue-900 text-sm">AI Tailoring Process</h5>
                        <ul className="text-xs text-blue-800 space-y-0.5">
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                            Analyzes job requirements and keywords
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                            Optimizes your experience descriptions
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                            Highlights relevant skills and achievements
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {importOption === 'import-profile' && (
                  <div className="ml-10 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Copy className="w-3 h-3 text-amber-600" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-medium text-amber-900 text-sm">Direct Copy Process</h5>
                        <ul className="text-xs text-amber-800 space-y-0.5">
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-amber-400"></div>
                            Creates an exact copy of your base resume
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-amber-400"></div>
                            Links it to the job posting for organization
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-amber-400"></div>
                            You can manually edit it afterwards
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex justify-between">
              <div>
                {dialogStep === 2 && (
                  <Button variant="outline" onClick={handleBack} size="sm">
                    {tResume("Back", "Retour")}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)} size="sm">
                  {L.cancel}
                </Button>
                {dialogStep === 1 && (
                  <Button onClick={handleNext} size="sm" className="bg-pink-600 hover:bg-pink-700">
                    {tResume("Next", "Suivant")}
                  </Button>
                )}
                {dialogStep === 2 && (
                  <Button 
                    onClick={handleCreate} 
                    disabled={isCreating}
                    size="sm"
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {openToLetterMode
                          ? tResume("Creating letter...", "Création de la lettre…")
                          : tResume("Creating...", "Création…")}
                      </>
                    ) : openToLetterMode ? (
                      tResume("Create cover letter", "Créer la lettre")
                    ) : (
                      tResume("Create Resume", "Créer le CV")
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <ApiErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        errorMessage={errorMessage}
        onUpgrade={() => {
          setShowErrorDialog(false);
          window.location.href = withBasePath('/subscription');
        }}
        onSettings={() => {
          setShowErrorDialog(false);
          window.location.href = withBasePath('/settings');
        }}
      />
    </>
  );
} 
