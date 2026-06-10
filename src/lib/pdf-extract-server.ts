import type { Buffer } from "node:buffer";

type PdfParseResult = { text?: string };

type PdfParseFn = (data: Buffer) => Promise<PdfParseResult>;

/**
 * pdf-parse/index.js runs a debug harness when `module.parent` is unset (common in
 * Next.js bundling) and tries to open test/data/05-versions-space.pdf → ENOENT.
 * Import the real parser directly.
 */
async function loadPdfParse(): Promise<PdfParseFn> {
  const mod = await import("pdf-parse/lib/pdf-parse.js");
  const fn = (mod as { default?: PdfParseFn }).default ?? (mod as unknown as PdfParseFn);
  if (typeof fn !== "function") {
    throw new Error("PDF parser unavailable");
  }
  return fn;
}

export class PdfTextEmptyError extends Error {
  constructor() {
    super(
      "Ce PDF ne contient pas de texte sélectionnable (souvent un scan). Exportez-le en image ou utilisez un PDF avec texte natif."
    );
    this.name = "PdfTextEmptyError";
  }
}

export async function extractPdfTextFromBuffer(buffer: Buffer): Promise<string> {
  const pdfParse = await loadPdfParse();
  const result = await pdfParse(buffer);
  const text = (result.text ?? "").trim();
  if (!text) {
    throw new PdfTextEmptyError();
  }
  return text;
}
