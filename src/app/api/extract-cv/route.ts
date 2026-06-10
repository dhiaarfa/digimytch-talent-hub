import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";
import { detectCvFileType } from "@/lib/cv-file-extract-shared";
import { extractCvTextFromImage } from "@/lib/ocr-cv-from-image";
import { extractPdfTextFromBuffer, PdfTextEmptyError } from "@/lib/pdf-extract-server";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { getSubscriptionPlan } from "@/utils/actions/stripe/actions";
import { AIUsageError } from "@/lib/ai/usage-ledger";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024;

async function extractWord(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "Fichier manquant." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return Response.json(
        { error: "Fichier trop volumineux (max 12 Mo)." },
        { status: 400 }
      );
    }

    const category = detectCvFileType({
      type: file.type,
      name: file.name,
    });

    if (category === "unknown") {
      const isLegacyDoc =
        file.type === "application/msword" || file.name.toLowerCase().endsWith(".doc");
      return Response.json(
        {
          error: isLegacyDoc
            ? "Les fichiers Word .doc (ancien format) ne sont pas supportés. Enregistrez en .docx ou PDF."
            : "Format non supporté. Utilisez PDF, Word (.docx) ou une image.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (category === "pdf") {
      text = await extractPdfTextFromBuffer(buffer);
    } else if (category === "word") {
      try {
        text = await extractWord(buffer);
      } catch (wordError) {
        logger.warn("[api/extract-cv] mammoth failed", wordError);
        return Response.json(
          {
            error:
              "Impossible de lire ce fichier Word. Vérifiez qu'il s'agit d'un .docx valide.",
          },
          { status: 422 }
        );
      }
    } else {
      const { plan, id } = await getSubscriptionPlan(true);
      const isPro = IS_DIGIMYTCH_TALENT_HUB || plan === "pro";
      const userId = id ?? "guest-ocr";
      const base64 = buffer.toString("base64");
      const mimeType = file.type || "image/jpeg";
      text = await extractCvTextFromImage({ base64, mimeType, userId, isPro });
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return Response.json(
        { error: "Aucun texte lisible trouvé dans ce fichier." },
        { status: 422 }
      );
    }

    return Response.json({ text: trimmed, category });
  } catch (error) {
    logger.error("[api/extract-cv]", error);
    if (error instanceof PdfTextEmptyError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof AIUsageError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible d'extraire le texte du fichier.",
      },
      { status: 500 }
    );
  }
}
