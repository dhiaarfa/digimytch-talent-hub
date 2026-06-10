"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { MessageSquareWarning, Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitCandidateFeedback } from "@/utils/actions/feedback/actions";

const EXPERIENCE_OPTIONS = [
  { id: "excellent" as const, label: "Excellente", emoji: "😊" },
  { id: "good" as const, label: "Bonne", emoji: "🙂" },
  { id: "average" as const, label: "Moyenne", emoji: "😐" },
  { id: "poor" as const, label: "Difficile", emoji: "😞" },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"rating" | "detail">("rating");
  const [experience, setExperience] = useState<(typeof EXPERIENCE_OPTIONS)[number]["id"] | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();

  const reset = () => {
    setStep("rating");
    setExperience(null);
    setMessage("");
  };

  const submitRating = (choice: (typeof EXPERIENCE_OPTIONS)[number]["id"]) => {
    setExperience(choice);
    if (choice === "excellent" || choice === "good") {
      startTransition(async () => {
        const result = await submitCandidateFeedback({
          category: "rating",
          experienceChoice: choice,
          pagePath: pathname,
        });
        if (result.ok) {
          toast.success("Merci pour votre retour !");
          setOpen(false);
          reset();
        } else {
          toast.error(result.error);
        }
      });
      return;
    }
    setStep("detail");
  };

  const submitComplaint = () => {
    startTransition(async () => {
      const result = await submitCandidateFeedback({
        category: experience === "poor" ? "complaint" : "suggestion",
        experienceChoice: experience ?? undefined,
        message,
        pagePath: pathname,
      });
      if (result.ok) {
        toast.success("Message envoyé à l'équipe Digimytch.");
        setOpen(false);
        reset();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-24 z-50 w-12 h-12 rounded-full shadow-lg bg-white border border-[var(--digi-border)] flex items-center justify-center text-[var(--digi-navy)] hover:scale-105 transition-transform"
        title="Signaler un problème ou donner votre avis"
        aria-label="Réclamation et avis"
      >
        <MessageSquareWarning size={20} aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-24 right-6 z-50 w-[min(100vw-2rem,22rem)] rounded-2xl border border-[var(--digi-border)] bg-white shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--digi-navy)] text-white">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Star className="h-4 w-4" aria-hidden />
                Votre expérience
              </div>
              <button type="button" onClick={() => { setOpen(false); reset(); }} aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {step === "rating" ? (
                <>
                  <p className="text-sm text-[var(--digi-muted)]">
                    Comment se passe votre utilisation de Talent Hub aujourd&apos;hui ?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={pending}
                        onClick={() => submitRating(opt.id)}
                        className="rounded-xl border border-[var(--digi-border)] p-3 text-left hover:border-[var(--digi-accent)] hover:bg-[var(--digi-surface)] transition-colors"
                      >
                        <span className="text-lg">{opt.emoji}</span>
                        <span className="block text-sm font-medium mt-1">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-[var(--digi-muted)]">
                    Décrivez le problème rencontré — l&apos;administrateur sera notifié.
                  </p>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ex. : l'aperçu PDF ne s'affiche pas, le score semble incorrect…"
                    rows={4}
                  />
                  <Button
                    type="button"
                    className="btn-digi-primary w-full"
                    disabled={pending || message.trim().length < 8}
                    onClick={submitComplaint}
                  >
                    Envoyer à l&apos;administration
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
