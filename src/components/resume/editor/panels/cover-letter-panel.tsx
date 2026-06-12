import { Resume, Job } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Trash2, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AIConfig } from "@/utils/ai-tools";
import { generateCoverLetterText } from "@/utils/actions/cover-letter/actions";
import { updateResume } from "@/utils/actions/resumes/actions";
import { useResumeContext } from "../resume-editor-context";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useApiKeys, useDefaultModel } from "@/hooks/use-api-keys";
import { getDefaultModel, selectBestModelForTask } from "@/lib/ai-models";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { resumeLabels } from "@/lib/resume-labels";
import {
  normalizeCoverLetterContent,
  hasCoverLetterContent,
} from "@/lib/cover-letter-html";
import { mergeCoverLetterPayload } from "@/lib/cover-letter-settings";

const MANUAL_PLACEHOLDER =
  "Madame, Monsieur,\n\nJe me permets de vous adresser ma candidature pour le poste de…\n\nCordialement,";

interface CoverLetterPanelProps {
  resume: Resume;
  job: Job | null;
  aiConfig?: AIConfig;
  /** Mode lettre dédié : génération auto + aperçu live à droite */
  letterMode?: boolean;
}

function getCoverLetterPlain(resume: Resume): string {
  const raw = resume.cover_letter?.content;
  if (typeof raw !== "string") return "";
  if (/<[a-z]/i.test(raw)) {
    return raw
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  return raw;
}

export function CoverLetterPanel({
  resume,
  job,
  aiConfig,
  letterMode = false,
}: CoverLetterPanelProps) {
  const { state, dispatch } = useResumeContext();
  const router = useRouter();
  const L = resumeLabels();
  const { apiKeys } = useApiKeys();
  const { defaultModel } = useDefaultModel();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoGenStarted = useRef(false);
  const [showManualEditor, setShowManualEditor] = useState(
    () => hasCoverLetterContent(resume) || letterMode
  );
  const [draft, setDraft] = useState(() => getCoverLetterPlain(resume));

  const updateField = useCallback(
    (field: keyof Resume, value: Resume[keyof Resume]) => {
      dispatch({ type: "UPDATE_FIELD", field, value });
    },
    [dispatch]
  );

  useEffect(() => {
    const plain = getCoverLetterPlain(state.resume);
    if (plain && plain !== draft) {
      setDraft(plain);
      setShowManualEditor(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- sync draft when persisted content changes
  }, [state.resume.cover_letter?.content, state.resume.has_cover_letter]);

  const resolveConfig = (): AIConfig => {
    const fallback = IS_DIGIMYTCH_TALENT_HUB
      ? selectBestModelForTask("lettre")
      : getDefaultModel(true);
    return {
      model: aiConfig?.model || defaultModel || fallback,
      apiKeys: aiConfig?.apiKeys ?? apiKeys,
    };
  };

  const applyContentToContext = useCallback(
    (content: string, persist = false) => {
      const html = normalizeCoverLetterContent(content);
      updateField(
        "cover_letter",
        mergeCoverLetterPayload(state.resume.cover_letter as Record<string, unknown>, {
          content: html,
        }) as Resume["cover_letter"]
      );
      updateField("has_cover_letter", true);
      setDraft(getCoverLetterPlain({ ...state.resume, cover_letter: { content: html } }));
      setShowManualEditor(true);

      if (persist) {
        setIsSaving(true);
        const merged: Resume = {
          ...state.resume,
          cover_letter: mergeCoverLetterPayload(
            state.resume.cover_letter as Record<string, unknown>,
            { content: html }
          ) as Resume["cover_letter"],
          has_cover_letter: true,
        };
        void updateResume(state.resume.id, merged)
          .then(() => {
            dispatch({ type: "SET_HAS_CHANGES", value: false });
          })
          .catch((err) => {
            toast({
              title: "Enregistrement impossible",
              description: err instanceof Error ? err.message : "Erreur réseau",
              variant: "destructive",
            });
          })
          .finally(() => setIsSaving(false));
      }
    },
    [dispatch, state.resume, updateField]
  );

  const saveManualLetter = () => {
    const content = draft.trim();
    if (!content) {
      toast({
        title: "Lettre vide",
        description: "Rédigez au moins une phrase avant d'enregistrer.",
        variant: "destructive",
      });
      return;
    }
    applyContentToContext(content, true);
    toast({
      title: "Lettre enregistrée",
      description: "Visible dans l'aperçu à droite.",
    });
  };

  const generateCoverLetter = async (mode: "full" | "improve") => {
    if (mode === "full" && !job) {
      toast({
        title: "Offre requise",
        description: "Ce CV doit être lié à une offre pour générer la lettre.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompt =
        mode === "improve"
          ? [
              "Améliore cette lettre de motivation en français (même structure, ton professionnel) :",
              draft,
            ].join("\n")
          : [
              "Rédige une lettre de motivation pour cette offre et ce CV :",
              `Offre : ${JSON.stringify(job)}`,
              `CV : ${JSON.stringify({
                name: `${resume.first_name} ${resume.last_name}`,
                target_role: resume.target_role,
                work_experience: resume.work_experience,
                education: resume.education,
                skills: resume.skills,
                projects: resume.projects,
              })}`,
              `Date : ${new Date().toLocaleDateString("fr-FR")}.`,
              `Coordonnées : ${resume.first_name} ${resume.last_name}, ${resume.email}`,
            ].join("\n");

      const result = await generateCoverLetterText(prompt, resolveConfig());
      if (!result.ok) {
        toast({
          title: "Génération impossible",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      applyContentToContext(result.content, true);
      toast({
        title: mode === "improve" ? "Lettre améliorée" : "Lettre générée",
        description: "Consultez l'aperçu à droite.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur inattendue.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!letterMode || !job || autoGenStarted.current) return;
    if (getCoverLetterPlain(state.resume).length > 40) return;
    autoGenStarted.current = true;
    void generateCoverLetter("full");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount when empty
  }, [letterMode, job?.id]);

  useEffect(() => {
    if (!letterMode || !draft.trim()) return;
    const t = setTimeout(() => {
      applyContentToContext(draft, false);
    }, 400);
    return () => clearTimeout(t);
  }, [draft, letterMode, applyContentToContext]);

  const manualEditor = (
    <div className="space-y-3">
      {letterMode && isGenerating && (
        <p className="text-xs text-amber-800 bg-amber-100/80 rounded-md px-2 py-1.5 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
          Rédaction automatique de votre lettre à partir de l&apos;offre et du CV…
        </p>
      )}
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={MANUAL_PLACEHOLDER}
        rows={12}
        className="text-sm font-normal resize-y min-h-[200px]"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={saveManualLetter}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          {L.save}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isGenerating || !draft.trim()}
          onClick={() => void generateCoverLetter("improve")}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          Améliorer avec l&apos;IA
        </Button>
        {hasCoverLetterContent(state.resume) && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              updateField("has_cover_letter", false);
              updateField("cover_letter", null);
              setDraft("");
              setShowManualEditor(letterMode);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );

  if (resume.is_base_resume && !letterMode) {
    return (
      <div
        className={cn(
          "p-4 backdrop-blur-xl rounded-lg shadow-lg bg-purple-50/80 border border-purple-200",
          "space-y-4"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-purple-100/80">
            <FileText className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-purple-900">{L.coverLetterLabel}</h3>
        </div>
        <p className="text-sm text-purple-700/90">
          Créez un CV sur mesure depuis une offre, puis ouvrez-le en mode lettre.
        </p>
        <Button type="button" size="sm" variant="outline" onClick={() => router.push("/jobs")}>
          Analyser une offre →
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-4 backdrop-blur-xl rounded-lg shadow-lg bg-white/80 border",
        letterMode ? "border-amber-300/70" : "border-emerald-600/50",
        "space-y-4"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-emerald-100/80">
          <FileText className="h-4 w-4 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-emerald-900">{L.coverLetterLabel}</h3>
      </div>

      {letterMode && (
        <p className="text-xs text-[var(--digi-muted)]">
          La lettre est générée automatiquement à partir de votre offre et de votre CV. Utilisez
          l&apos;assistant IA en bas (comme pour le CV) pour proposer des modifications — acceptez ou
          refusez chaque suggestion. Aperçu et mise en page à droite.
        </p>
      )}

      {showManualEditor || letterMode ? (
        manualEditor
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Rédigez votre lettre ou laissez l&apos;IA la générer à partir de l&apos;offre liée.
          </p>
          {job && (
            <Button
              type="button"
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => void generateCoverLetter("full")}
              disabled={isGenerating}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {L.createCoverLetter}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
