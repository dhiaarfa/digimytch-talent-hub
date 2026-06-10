export interface CoverLetterDocumentSettings {
  document_font_size: number;
  document_line_height: number;
  document_margin_vertical: number;
  document_margin_horizontal: number;
  paragraph_spacing: number;
}

export const DEFAULT_COVER_LETTER_SETTINGS: CoverLetterDocumentSettings = {
  document_font_size: 12,
  document_line_height: 1.55,
  document_margin_vertical: 52,
  document_margin_horizontal: 72,
  paragraph_spacing: 14,
};

export function getCoverLetterSettings(
  coverLetter: Record<string, unknown> | null | undefined
): CoverLetterDocumentSettings {
  const raw = coverLetter?.settings;
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_COVER_LETTER_SETTINGS };
  }
  const s = raw as Partial<CoverLetterDocumentSettings>;
  return {
    document_font_size: clamp(s.document_font_size ?? 12, 9, 16),
    document_line_height: clamp(s.document_line_height ?? 1.55, 1.2, 2),
    document_margin_vertical: clamp(s.document_margin_vertical ?? 52, 24, 96),
    document_margin_horizontal: clamp(s.document_margin_horizontal ?? 72, 32, 120),
    paragraph_spacing: clamp(s.paragraph_spacing ?? 14, 4, 32),
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function mergeCoverLetterPayload(
  current: Record<string, unknown> | null | undefined,
  patch: {
    content?: string;
    settings?: CoverLetterDocumentSettings;
  }
): Record<string, unknown> {
  const base = current && typeof current === "object" ? { ...current } : {};
  return {
    ...base,
    ...(patch.content !== undefined ? { content: patch.content } : {}),
    ...(patch.settings !== undefined ? { settings: patch.settings } : {}),
    lastUpdated: new Date().toISOString(),
  };
}
