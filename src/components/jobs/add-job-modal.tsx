"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createJob } from "@/utils/actions/jobs/actions";
import { formatJobListing } from "@/utils/actions/jobs/ai";
import { toast } from "sonner";
import { addNotification } from "@/components/ui/notification-center";

type AddJobModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddJobModal({ open, onOpenChange }: AddJobModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
  };

  const handleAnalyze = async () => {
    const t = title.trim();
    const d = description.trim();
    if (!t) {
      toast.error("Indiquez le titre du poste.");
      return;
    }
    if (d.length < 50) {
      toast.error("Collez au moins 50 caractères de l'annonce pour une analyse fiable.");
      return;
    }

    setLoading(true);
    try {
      let payload;
      try {
        payload = await formatJobListing(`Titre: ${t}\n\n${d}`);
      } catch {
        payload = {
          position_title: t,
          company_name: "Entreprise non précisée",
          description: d,
          keywords: [],
        };
      }

      if (!payload.position_title) {
        payload = { ...payload, position_title: t };
      }

      await createJob(payload);
      toast.success("Offre analysée et ajoutée à votre liste.");
      addNotification({
        type: "success",
        title: "Offre ajoutée",
        message: `« ${payload.position_title || "Nouvelle offre"} » est prête pour le matching.`,
        action: { label: "Voir mes offres →", href: "/jobs" },
      });
      reset();
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Impossible d'analyser l'offre.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Analyser une offre d&apos;emploi</DialogTitle>
          <DialogDescription>
            Collez le texte de l&apos;annonce depuis LinkedIn, Rekrute, Indeed ou tout autre site.
            Votre score de compatibilité sera calculé automatiquement.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="job-title">Titre du poste *</Label>
            <Input
              id="job-title"
              placeholder="ex. Développeur Full Stack, Chef de projet…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-desc">Texte de l&apos;annonce *</Label>
            <Textarea
              id="job-desc"
              placeholder="Collez ici le texte complet de l'offre d'emploi…"
              rows={8}
              className="font-mono text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-xs text-[var(--digi-muted)]">
              Plus le texte est complet, plus le score sera précis.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button type="button" className="btn-digi-primary" onClick={() => void handleAnalyze()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Analyser →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
