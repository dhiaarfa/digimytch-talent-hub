import { logger } from "@/lib/logger";
import { getSubscriptionPlan } from "@/utils/actions/stripe/actions";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { AIUsageError } from "@/lib/ai/usage-ledger";
import { extractCvTextFromImage } from "@/lib/ocr-cv-from-image";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const bodySchema = z.object({
  base64: z.string().min(10),
  mimeType: z.string().regex(/^image\//),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: "base64 image required" }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const { plan, id } = await getSubscriptionPlan(true);
    const isPro = IS_DIGIMYTCH_TALENT_HUB || plan === "pro";
    const userId = id || user.id;

    const text = await extractCvTextFromImage({
      base64: body.base64,
      mimeType: body.mimeType,
      userId,
      isPro,
    });

    return Response.json({ text });
  } catch (error) {
    logger.error("[api/ocr-cv]", error);
    if (error instanceof AIUsageError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "OCR failed" },
      { status: 500 }
    );
  }
}
