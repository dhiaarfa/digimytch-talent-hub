export const CV_ACCEPT_EXTENSIONS = ".pdf,.docx,.jpg,.jpeg,.png,.webp,.gif";

export type CvFileCategory = "pdf" | "word" | "image" | "unknown";

export function detectCvFileType(file: {
  type: string;
  name: string;
}): CvFileCategory {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }
  if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  ) {
    return "word";
  }
  if (
    file.type === "application/msword" ||
    file.name.toLowerCase().endsWith(".doc")
  ) {
    return "unknown";
  }
  if (file.type.startsWith("image/")) {
    return "image";
  }
  return "unknown";
}

export function cvExtractingLabel(category: CvFileCategory): string {
  if (category === "pdf") return "Extraction du PDF…";
  if (category === "word") return "Extraction du document Word…";
  return "Analyse OCR de l'image…";
}
