"use client";

import { useMemo } from "react";
import { useResumeContext } from "../resume-editor-context";
import { normalizeCoverLetterContent, hasCoverLetterContent } from "@/lib/cover-letter-html";
import { sanitizeRichTextHtml } from "@/lib/html-safety";
import CoverLetterEditor from "@/components/cover-letter/cover-letter-editor";
import { FileText } from "lucide-react";

import {
  type CoverLetterDocumentSettings,
  getCoverLetterSettings,
  mergeCoverLetterPayload,
} from "@/lib/cover-letter-settings";

interface LetterLivePreviewProps {
  containerWidth: number;
  settings?: CoverLetterDocumentSettings;
  readOnly?: boolean;
}

export function LetterLivePreview({
  containerWidth,
  settings: settingsProp,
  readOnly = false,
}: LetterLivePreviewProps) {
  const { state, dispatch } = useResumeContext();
  const settings =
    settingsProp ??
    getCoverLetterSettings(state.resume.cover_letter as Record<string, unknown> | undefined);
  const content = state.resume.cover_letter?.content;
  const html = useMemo(
    () =>
      sanitizeRichTextHtml(
        normalizeCoverLetterContent(
          typeof content === "string" ? content : ""
        )
      ),
    [content]
  );

  const hasContent = hasCoverLetterContent(state.resume);

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-center p-8 text-[var(--digi-muted)]">
        <FileText className="h-12 w-12 mb-3 opacity-40" aria-hidden />
        <p className="text-sm font-medium text-[var(--digi-navy)]">
          Aperçu de la lettre
        </p>
        <p className="text-xs mt-2 max-w-xs">
          La lettre apparaîtra ici dès la génération ou la saisie à gauche.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <CoverLetterEditor
        key={`${html.slice(0, 80)}-${settings.document_font_size}`}
        initialData={{ content: html }}
        containerWidth={containerWidth}
        settings={settings}
        readOnly={readOnly}
        onChange={
          readOnly
            ? undefined
            : (data) => {
                const next = typeof data.content === "string" ? data.content : "";
                dispatch({
                  type: "UPDATE_FIELD",
                  field: "cover_letter",
                  value: mergeCoverLetterPayload(
                    state.resume.cover_letter as Record<string, unknown>,
                    { content: next, settings }
                  ) as typeof state.resume.cover_letter,
                });
                dispatch({ type: "UPDATE_FIELD", field: "has_cover_letter", value: true });
              }
        }
      />
    </div>
  );
}
