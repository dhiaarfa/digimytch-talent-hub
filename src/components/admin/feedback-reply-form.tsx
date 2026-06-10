"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyToCandidateFeedback } from "@/utils/actions/feedback/actions";

export function FeedbackReplyForm({
  feedbackId,
  userEmail,
  existingReply,
  onReplied,
}: {
  feedbackId: string;
  userEmail: string | null;
  existingReply: string | null;
  onReplied: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(existingReply ?? "");
  const [sending, setSending] = useState(false);

  if (existingReply && !open) {
    return (
      <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
        <p className="text-xs font-medium text-muted-foreground mb-1">Réponse envoyée par e-mail</p>
        <p className="whitespace-pre-wrap">{existingReply}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-8"
          onClick={() => setOpen(true)}
        >
          Modifier et renvoyer
        </Button>
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        disabled={!userEmail}
        onClick={() => setOpen(true)}
      >
        <Mail className="h-4 w-4 mr-1" aria-hidden />
        Répondre par e-mail
      </Button>
    );
  }

  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        void (async () => {
          setSending(true);
          const result = await replyToCandidateFeedback({
            feedbackId,
            replyMessage: message,
          });
          setSending(false);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(`Réponse envoyée à ${userEmail ?? "candidat"}.`);
          setOpen(false);
          onReplied();
        })();
      }}
    >
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Votre réponse au candidat…"
        rows={4}
        required
        minLength={10}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={sending || !userEmail}>
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" aria-hidden />
          ) : (
            <Mail className="h-4 w-4 mr-1" aria-hidden />
          )}
          Envoyer l&apos;e-mail
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setMessage(existingReply ?? "");
          }}
        >
          Annuler
        </Button>
      </div>
      {!userEmail && (
        <p className="text-xs text-red-600">Aucun e-mail enregistré pour ce candidat.</p>
      )}
    </form>
  );
}
