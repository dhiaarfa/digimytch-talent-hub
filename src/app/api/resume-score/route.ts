import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { Job, Resume, ServiceName } from "@/lib/types";
import type { AIConfig } from "@/lib/ai-models";
import { computeResumeScore } from "@/lib/resume-score-service";
import { stripJobForScoring, stripResumeForScoring } from "@/lib/resume-score-payload";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

type ScoreRequestBody = {
  resume?: Resume;
  job?: Job | null;
  model?: string;
  apiKeys?: { service: string; key: string; addedAt: string }[];
};

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

    let body: ScoreRequestBody;
    try {
      body = (await request.json()) as ScoreRequestBody;
    } catch {
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
    }

    if (!body.resume?.id && !body.resume?.user_id) {
      return NextResponse.json({ error: "CV manquant" }, { status: 400 });
    }

    const resume = stripResumeForScoring(body.resume);
    const job = stripJobForScoring(body.job ?? null);

    const aiConfig: AIConfig = {
      model: body.model ?? "",
      apiKeys: (body.apiKeys ?? []).map((entry) => ({
        ...entry,
        service: entry.service as ServiceName,
      })),
    };

    const result = await computeResumeScore(resume, job, aiConfig);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("[api/resume-score]", error);
    const message =
      error instanceof Error ? error.message : "Impossible de calculer le score CV";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
