import { logger } from "@/lib/logger";
import { getSubscriptionPlan } from "@/utils/actions/stripe/actions";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
import { AIUsageError } from "@/lib/ai/usage-ledger";
import { friendlyAIErrorMessage } from "@/lib/ai/plan";
import { analyzeLinkedInScreenshot } from "@/lib/linkedin-analyze";
import { isOpenRouterRateLimitError } from "@/lib/digimytch-openrouter-models";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const bodySchema = z.object({
  base64: z.string().min(10).max(4_500_000),
  mimeType: z.string().regex(/^image\//),
  lang: z.enum(["fr", "en"]).optional().default("fr"),
  model: z.string().max(120).optional(),
});

const RATE_LIMIT_MESSAGE_FR =
  "Les modèles IA gratuits sont saturés (trop de requêtes). Réessayez dans 1 à 2 minutes, ou utilisez une image plus légère (capture JPG, pas trop grande).";

const RATE_LIMIT_MESSAGE_EN =
  "Free AI models are rate-limited. Try again in 1–2 minutes, or use a smaller screenshot (JPG).";

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
    if (!parsed.success) return Response.json({ error: "image required" }, { status: 400 });
    body = parsed.data;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const isFr = body.lang === "fr";
  const imageUrl = `data:${body.mimeType};base64,${body.base64}`;

  try {
    const { plan, id } = await getSubscriptionPlan(true);
    const isPro = IS_DIGIMYTCH_TALENT_HUB || plan === "pro";
    const userId = id || user.id;

    const result = await analyzeLinkedInScreenshot({
      userId,
      isPro,
      imageUrl,
      isFr,
      preferredModel: body.model,
    });

    return Response.json(result);
  } catch (error) {
    logger.error("[api/linkedin-analyze]", error);
    if (error instanceof AIUsageError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (
      error instanceof Error &&
      (error.message === "RATE_LIMIT_LINKEDIN" || isOpenRouterRateLimitError(error))
    ) {
      return Response.json(
        { error: isFr ? RATE_LIMIT_MESSAGE_FR : RATE_LIMIT_MESSAGE_EN },
        { status: 429 }
      );
    }

    const message = friendlyAIErrorMessage(error);
    if (/too many requests|failed after \d+ attempts/i.test(message)) {
      return Response.json(
        { error: isFr ? RATE_LIMIT_MESSAGE_FR : RATE_LIMIT_MESSAGE_EN },
        { status: 429 }
      );
    }

    return Response.json(
      {
        error: /invalid|json|read/i.test(message)
          ? isFr
            ? "L'IA n'a pas pu lire l'image. Essayez une capture plus nette (profil entier visible)."
            : "AI could not read the image. Try a clearer screenshot showing the full profile."
          : message,
      },
      { status: 500 }
    );
  }
}
