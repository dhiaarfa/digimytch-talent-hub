"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Sparkles } from "lucide-react";
import { normalizeCoverLetterContent } from "@/lib/cover-letter-html";
import { cn } from "@/lib/utils";

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface CoverLetterSuggestionProps {
  improvedContent: string;
  currentContent: string;
  onAccept: () => void;
  onReject: () => void;
}

export function CoverLetterSuggestion({
  improvedContent,
  currentContent,
  onAccept,
  onReject,
}: CoverLetterSuggestionProps) {
  const improvedHtml = normalizeCoverLetterContent(improvedContent);
  const currentPlain = stripHtml(normalizeCoverLetterContent(currentContent));
  const improvedPlain = stripHtml(improvedHtml);

  return (
    <Card className="p-3 border-amber-200/80 bg-amber-50/90 shadow-sm w-full">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-amber-700" aria-hidden />
        <p className="text-sm font-semibold text-amber-900">Suggestion pour votre lettre</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto text-xs mb-3">
        <div>
          <p className="font-medium text-[var(--digi-muted)] mb-1">Actuel</p>
          <p className="text-[var(--digi-dark)] whitespace-pre-wrap leading-relaxed line-clamp-8">
            {currentPlain || "—"}
          </p>
        </div>
        <div>
          <p className="font-medium text-emerald-700 mb-1">Proposé</p>
          <p
            className={cn(
              "text-[var(--digi-dark)] whitespace-pre-wrap leading-relaxed line-clamp-8",
              "bg-emerald-100/60 rounded-md p-2"
            )}
          >
            {improvedPlain}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8"
          onClick={onAccept}
        >
          <Check className="h-3.5 w-3.5 mr-1" aria-hidden />
          Accepter
        </Button>
        <Button type="button" size="sm" variant="outline" className="flex-1 h-8" onClick={onReject}>
          <X className="h-3.5 w-3.5 mr-1" aria-hidden />
          Refuser
        </Button>
      </div>
    </Card>
  );
}
