/** Convert plain-text or partial HTML letter content for TipTap / preview. */
export function normalizeCoverLetterContent(content: string | null | undefined): string {
  const trimmed = (content ?? "").trim();
  if (!trimmed) return "<p></p>";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;

  const paragraphs = trimmed.split(/\n{2,}/).filter(Boolean);
  if (paragraphs.length === 0) {
    return `<p>${escapeHtml(trimmed.replace(/\n/g, "<br />"))}</p>`;
  }

  return paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function hasCoverLetterContent(resume: {
  has_cover_letter?: boolean;
  cover_letter?: { content?: unknown } | null;
}): boolean {
  if (resume.has_cover_letter) return true;
  const raw = resume.cover_letter?.content;
  return typeof raw === "string" && raw.trim().length > 0;
}
