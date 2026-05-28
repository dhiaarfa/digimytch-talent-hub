"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { explainJobMatch } from "@/utils/actions/digimytch/explain-match";
import { addNotification } from "@/components/ui/notification-center";

export function JobMatchExplain({
  jobId,
  jobTitle,
  matchScore,
}: {
  jobId: string;
  jobTitle?: string;
  matchScore?: number;
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyzeWithAI() {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await explainJobMatch(jobId);
      if (result.ok) {
        setExplanation(result.explanation);
        const title = jobTitle?.trim() || "cette offre";
        const scoreText =
          typeof matchScore === "number" ? ` Score : ${matchScore}/100.` : "";
        addNotification({
          type: "success",
          title: "Analyse terminée",
          message: `Votre offre « ${title} » a été analysée.${scoreText}`,
          action: { label: "Voir le résultat →", href: "/jobs" },
        });
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch {
      const msg = "Erreur lors de l'analyse IA";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (!explanation && !isAnalyzing && !error) {
    return (
      <div className="text-center py-6 px-2">
        <p className="text-sm text-[var(--digi-muted)] mb-4">
          L&apos;IA analyse votre CV face à cette offre et explique votre score en français.
        </p>
        <Button
          type="button"
          onClick={handleAnalyzeWithAI}
          className="btn-digi-primary gap-2"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          Lancer l&apos;analyse IA
        </Button>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[var(--digi-accent)]" />
        <p className="text-sm text-[var(--digi-muted)]">Analyse en cours…</p>
      </div>
    );
  }

  if (error && !explanation) {
    return (
      <div className="space-y-3 py-4">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
        <Button type="button" size="sm" variant="outline" onClick={handleAnalyzeWithAI}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-2">
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{explanation}</p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setExplanation(null);
          setError(null);
        }}
      >
        Relancer l&apos;analyse
      </Button>
    </div>
  );
}
