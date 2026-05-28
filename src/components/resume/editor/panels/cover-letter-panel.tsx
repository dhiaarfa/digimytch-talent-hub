import { Resume, Job } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Trash2, Plus, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { AIConfig } from "@/utils/ai-tools";
import { generateCoverLetterText } from "@/utils/actions/cover-letter/actions";
import { useResumeContext } from "../resume-editor-context";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useApiKeys, useDefaultModel } from "@/hooks/use-api-keys";
import { getDefaultModel, selectBestModelForTask } from "@/lib/ai-models";
import { isDigimytchTalentHub } from "@/lib/digimytch-config";
import { addNotification } from "@/components/ui/notification-center";
import { resumeLabels } from "@/lib/resume-labels";

const MANUAL_PLACEHOLDER =
  "Madame, Monsieur,\n\nJe me permets de vous adresser ma candidature pour le poste de…\n\nCordialement,";

interface CoverLetterPanelProps {
  resume: Resume;
  job: Job | null;
  aiConfig?: AIConfig;
}

function getCoverLetterPlain(resume: Resume): string {
  const raw = resume.cover_letter?.content;
  if (typeof raw === "string") return raw;
  return "";
}

export function CoverLetterPanel({ resume, job, aiConfig }: CoverLetterPanelProps) {
  const { dispatch } = useResumeContext();
  const router = useRouter();
  const L = resumeLabels();
  const { apiKeys } = useApiKeys();
  const { defaultModel } = useDefaultModel();
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt] = useState("");
  const [showManualEditor, setShowManualEditor] = useState(
    () => resume.has_cover_letter || Boolean(getCoverLetterPlain(resume))
  );
  const [draft, setDraft] = useState(() => getCoverLetterPlain(resume));

  const updateField = (field: keyof Resume, value: Resume[keyof Resume]) => {
    dispatch({ type: "UPDATE_FIELD", field, value });
  };

  const resolveConfig = (): AIConfig => {
    const fallback = isDigimytchTalentHub()
      ? selectBestModelForTask("lettre")
      : getDefaultModel(true);
    return {
      model: aiConfig?.model || defaultModel || fallback,
      apiKeys: aiConfig?.apiKeys ?? apiKeys,
    };
  };

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
    updateField("cover_letter", { content, lastUpdated: new Date().toISOString() });
    updateField("has_cover_letter", true);
    toast({
      title: "Lettre enregistrée",
      description: "Votre lettre a été sauvegardée dans ce CV.",
    });
  };

  const generateCoverLetter = async (mode: "full" | "improve") => {
    if (mode === "full" && !job) {
      toast({
        title: "Offre requise",
        description: "Liez ce CV à une offre (CV sur mesure) pour une génération IA complète.",
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
              customPrompt ? `Consignes : ${customPrompt}` : "",
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
              customPrompt ? `Consignes : ${customPrompt}` : "",
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

      setDraft(result.content);
      updateField("cover_letter", { content: result.content, lastUpdated: new Date().toISOString() });
      updateField("has_cover_letter", true);
      setShowManualEditor(true);
      toast({
        title: mode === "improve" ? "Lettre améliorée" : "Lettre générée",
        description: "La lettre de motivation a été mise à jour.",
      });
      if (mode === "full" || mode === "improve") {
        const role =
          job?.position_title?.trim() ||
          resume.target_role?.trim() ||
          "votre candidature";
        addNotification({
          type: "success",
          title: "Lettre de motivation prête",
          message: `Votre lettre pour « ${role} » a été générée avec succès.`,
          action: { label: "Ouvrir →", href: "/resumes" },
        });
      }
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

  const manualEditor = (
    <div className="space-y-3">
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={MANUAL_PLACEHOLDER}
        rows={12}
        className="text-sm font-normal resize-y min-h-[200px]"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={saveManualLetter} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
        {resume.has_cover_letter && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              updateField("has_cover_letter", false);
              updateField("cover_letter", null);
              setDraft("");
              setShowManualEditor(false);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );

  if (resume.is_base_resume) {
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

        {showManualEditor ? (
          manualEditor
        ) : (
          <>
            <div className="border rounded-lg p-4 bg-white/80 space-y-2">
              <h4 className="font-medium text-purple-900">Rédiger manuellement</h4>
              <p className="text-sm text-purple-700/90">
                Commencez à écrire votre lettre directement dans l&apos;éditeur.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-purple-300"
                onClick={() => {
                  setShowManualEditor(true);
                  updateField("has_cover_letter", true);
                }}
              >
                Ouvrir l&apos;éditeur de lettre
              </Button>
            </div>

            <div className="border rounded-lg p-4 bg-white/80 space-y-2">
              <h4 className="font-medium text-purple-900">Générer avec l&apos;IA</h4>
              <p className="text-sm text-purple-700/90">
                L&apos;IA rédige une lettre adaptée à l&apos;offre. Nécessite un CV sur mesure lié à une annonce.
              </p>
              <p className="text-xs text-amber-700">
                Créez d&apos;abord un CV sur mesure depuis Analyser une offre.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => router.push("/jobs")}
              >
                Analyser une offre →
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-4 backdrop-blur-xl rounded-lg shadow-lg bg-white/80 border border-emerald-600/50",
        "space-y-4"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-emerald-100/80">
          <FileText className="h-4 w-4 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-emerald-900">{L.coverLetterLabel}</h3>
      </div>

      {showManualEditor || resume.has_cover_letter ? (
        <>
          {manualEditor}
          {job && (
            <div className="pt-2 border-t border-emerald-200/60 space-y-2">
              <p className="text-xs text-muted-foreground">
                Génération complète à partir de l&apos;offre et de votre CV :
              </p>
              <Button
                type="button"
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => void generateCoverLetter("full")}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {L.createCoverLetter}
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Rédigez votre lettre à la main ou laissez l&apos;IA la générer à partir de l&apos;offre liée.
          </p>
          <Button
            type="button"
            size="sm"
            className="w-full border-emerald-600/50 text-emerald-700"
            variant="outline"
            onClick={() => {
              setShowManualEditor(true);
              updateField("has_cover_letter", true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ouvrir l&apos;éditeur de lettre
          </Button>
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
