'use client';

import { useState, useEffect, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, AlertTriangle, FileText, FileImage, FileType, CheckCircle2 } from "lucide-react";
import { Resume } from "@/lib/types";
import { toast } from "sonner";
import { addTextToResume } from "@/utils/actions/resumes/ai";
import {
  type ApiKey,
  DIGIMYTCH_AI_MODEL_STORAGE_KEY,
  selectBestModelForTask,
} from "@/lib/ai-models";
import { updateResume } from "@/utils/actions/resumes/actions";
import { useRouter } from "next/navigation";
import { cn, withBasePath } from "@/lib/utils";
import { ProUpgradeButton } from "@/components/settings/pro-upgrade-button";
import {
  CV_ACCEPT_EXTENSIONS,
  cvExtractingLabel,
  detectCvFileType,
  extractTextFromCvFile,
} from "@/lib/cv-file-extract";

interface TextImportDialogProps {
  resume: Resume;
  onResumeChange: (field: keyof Resume, value: Resume[keyof Resume]) => void;
  trigger: React.ReactNode;
}

export function TextImportDialog({ resume, onResumeChange, trigger }: TextImportDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractingLabel, setExtractingLabel] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [apiKeyError, setApiKeyError] = useState("");
  const [lastFileName, setLastFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setApiKeyError("");
      setLastFileName(null);
    }
  }, [open]);

  const processFile = async (file: File) => {
    const category = detectCvFileType(file);
    if (category === "unknown") {
      toast.error("Format non supporté", {
        description: "Utilisez PDF, Word (.docx) ou une image.",
      });
      return;
    }

    setIsExtracting(true);
    setExtractingLabel(cvExtractingLabel(category));
    setLastFileName(file.name);

    try {
      const { text } = await extractTextFromCvFile(file);

      if (!text) {
        toast.error("Aucun texte détecté", {
          description: "Vérifiez que le fichier contient du texte lisible.",
        });
      } else {
        setContent((prev) => (prev ? `${prev}\n\n${text}` : text));
        toast.success("Fichier chargé", {
          description: `${file.name} — ${text.length} caractères extraits.`,
        });
      }
    } catch (err) {
      toast.error("Erreur d'extraction", {
        description: err instanceof Error ? err.message : "Impossible de lire ce fichier.",
      });
      setLastFileName(null);
    } finally {
      setIsExtracting(false);
      setExtractingLabel("");
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = Array.from(e.dataTransfer.files)[0];
    if (file) await processFile(file);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
    e.target.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === "dragenter" || e.type === "dragover");
  };

  const handleImport = async () => {
    setApiKeyError("");
    if (!content.trim()) {
      toast.error("Aucun contenu", {
        description: "Ajoutez un fichier ou collez du texte avant d'importer.",
      });
      return;
    }
    setIsProcessing(true);
    try {
      const selectedModel =
        (typeof window !== "undefined" &&
          (localStorage.getItem(DIGIMYTCH_AI_MODEL_STORAGE_KEY) ||
            localStorage.getItem("resumelm-default-model"))) ||
        selectBestModelForTask("cv");
      let apiKeys: ApiKey[] = [];
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("resumelm-api-keys");
          apiKeys = stored ? (JSON.parse(stored) as ApiKey[]) : [];
        } catch {
          apiKeys = [];
        }
      }
      const updatedResume = await addTextToResume(content, resume, {
        model: selectedModel,
        apiKeys,
      });
      await updateResume(resume.id, updatedResume as Partial<Resume>);

      (Object.keys(updatedResume) as Array<keyof Resume>).forEach((key) => {
        onResumeChange(key, updatedResume[key] as Resume[keyof Resume]);
      });

      toast.success("CV importé et enregistré", {
        description: "L'aperçu PDF va se mettre à jour.",
        action: {
          label: "Voir le CV",
          onClick: () => router.refresh(),
        },
      });
      router.refresh();
      setOpen(false);
      setContent("");
      setLastFileName(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur inconnue";
      if (msg.includes("API key") || msg.includes("api key")) {
        setApiKeyError("Clé API requise. Ajoutez votre clé dans les Paramètres ou passez au Plan Pro.");
        toast.error("Clé API requise pour l'analyse IA");
      } else {
        toast.error("Import échoué", { description: msg });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-xl border-white/40 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-[var(--digi-navy)]">
            Importer un CV
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-1 mt-1">
              <p>Étape 1 : chargez un fichier ou collez le texte. Étape 2 : cliquez Importer pour l&apos;analyse IA.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { icon: FileText, label: "PDF", color: "text-red-500" },
                  { icon: FileType, label: "Word (.docx)", color: "text-blue-500" },
                  { icon: FileImage, label: "Image (OCR)", color: "text-green-600" },
                ].map(({ icon: Icon, label, color }) => (
                  <span key={label} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                    <Icon className={cn("h-3.5 w-3.5", color)} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept={CV_ACCEPT_EXTENSIONS}
            onChange={handleFileInput}
          />

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            onClick={() => !isExtracting && fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer group",
              isDragging ? "border-[var(--digi-accent)] bg-[var(--digi-accent)]/5 scale-[1.01]" :
              isExtracting ? "border-[var(--digi-navy)] bg-[var(--digi-navy)]/5 pointer-events-none" :
              "border-[var(--digi-border)] hover:border-[var(--digi-navy)] hover:bg-[var(--digi-surface)]"
            )}
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-10 h-10 text-[var(--digi-navy)] animate-spin" />
                <p className="text-sm font-medium text-[var(--digi-navy)]">{extractingLabel}</p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-[var(--digi-muted)] group-hover:text-[var(--digi-navy)] transition-colors" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--digi-dark)]">
                    Glissez votre CV ici
                  </p>
                  <p className="text-xs text-[var(--digi-muted)] mt-0.5">
                    ou cliquez pour choisir — PDF, Word, Image
                  </p>
                </div>
              </>
            )}
          </div>

          {lastFileName && content.trim() && !isExtracting && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>{lastFileName}</strong> — {content.trim().length} caractères prêts.
                Cliquez <strong>Importer</strong> pour remplir le CV.
              </span>
            </div>
          )}

          <div className="relative">
            <div className="absolute -top-2.5 left-3 bg-white px-2 text-xs text-[var(--digi-muted)]">
              Texte extrait / collé
              {content.trim() ? (
                <span className="ml-2 text-[var(--digi-accent)] font-medium">
                  ({content.trim().length} car.)
                </span>
              ) : null}
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Le texte de votre CV apparaîtra ici après upload…"
              className="min-h-[140px] pt-4 text-sm focus:ring-[var(--digi-navy)]/20"
            />
          </div>
        </div>

        {apiKeyError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1 space-y-2">
              <p className="font-medium">Clé API requise</p>
              <p className="text-red-600 text-xs">{apiKeyError}</p>
              <div className="flex flex-wrap gap-2">
                <ProUpgradeButton />
                <Button variant="outline" size="sm" className="text-red-600 border-red-200"
                  onClick={() => { window.location.href = withBasePath("/settings"); }}>
                  Paramètres
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button
            onClick={handleImport}
            disabled={isProcessing || isExtracting || !content.trim()}
            className="btn-digi-primary"
          >
            {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyse IA…</> : "Importer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
