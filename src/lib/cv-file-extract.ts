import {
  CV_ACCEPT_EXTENSIONS,
  cvExtractingLabel,
  detectCvFileType,
  type CvFileCategory,
} from "@/lib/cv-file-extract-shared";
import { withBasePath } from "@/lib/utils";

export { CV_ACCEPT_EXTENSIONS, cvExtractingLabel, detectCvFileType };
export type { CvFileCategory };

export type ExtractCvFileResult = {
  text: string;
  category: CvFileCategory;
};

/**
 * Extract CV text via server API (pdf-parse / mammoth / OCR).
 * Reliable in browser — no pdf.js worker on client.
 */
export async function extractTextFromCvFile(file: File): Promise<ExtractCvFileResult> {
  const category = detectCvFileType(file);
  if (category === "unknown") {
    throw new Error("Format non supporté. Utilisez PDF, Word (.docx) ou une image.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(withBasePath("/api/extract-cv"), {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });

  const payload = (await res.json().catch(() => ({}))) as {
    text?: string;
    category?: CvFileCategory;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(payload.error ?? "Impossible d'extraire le texte du fichier.");
  }

  const text = (payload.text ?? "").trim();
  return {
    text,
    category: payload.category ?? category,
  };
}
