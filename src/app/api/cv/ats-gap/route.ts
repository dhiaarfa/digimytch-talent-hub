import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { analyzeAtsKeywordGap } from "@/lib/ats-gap-analyzer";
import { atsGapRequestSchema } from "@/lib/ats-gap-schema";
import { friendlyAIErrorMessage } from "@/lib/ai/friendly-error";
import { getAIPlanState } from "@/lib/ai/plan";
import { logger } from "@/lib/logger";
import type { AIConfig } from "@/lib/ai-models";
import type { ServiceName } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
    }

    const parsed = atsGapRequestSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Données invalides";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { cv_content, job_description, model, apiKeys } = parsed.data;
    const { isPro, userId } = await getAIPlanState();

    const aiConfig: AIConfig = {
      model: model ?? "",
      apiKeys: (apiKeys ?? []).map((entry) => ({
        ...entry,
        service: entry.service as ServiceName,
      })),
    };

    const result = await analyzeAtsKeywordGap(
      cv_content,
      job_description,
      aiConfig,
      { userId, isPro }
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error("[api/cv/ats-gap]", error);
    const message = friendlyAIErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
