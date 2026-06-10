"use server";

import { generateText } from "ai";
import { createClient } from "@/utils/supabase/server";
import { getJobsWithMatchScores } from "@/utils/actions/digimytch/actions";
import {
  finishAIUsageRequest,
  startAIUsageRequest,
} from "@/lib/ai/usage-ledger";
import { hashJobListing } from "@/lib/job-analysis-cache";
import { friendlyAIErrorMessage, getAIPlanState, resolveTaskModel } from "@/lib/ai/plan";

const CACHE_TTL_HOURS = 24;

export type ExplainMatchResult =
  | { ok: true; explanation: string }
  | { ok: false; error: string };

export async function explainJobMatch(jobId: string): Promise<ExplainMatchResult> {
  try {
    const { resume, jobsWithMatch } = await getJobsWithMatchScores();
    const item = jobsWithMatch.find((j) => j.job.id === jobId);
    if (!item) {
      return { ok: false, error: "Offre introuvable." };
    }
    if (!resume) {
      return {
        ok: false,
        error: "Créez un CV de base pour obtenir une explication personnalisée.",
      };
    }

    const { job, match } = item;
    const supabase = await createClient();
    const jobHash = hashJobListing(job);

    const { data: cached } = await supabase
      .from("job_analysis_cache")
      .select("analysis")
      .eq("job_hash", jobHash)
      .gt("created_at", new Date(Date.now() - CACHE_TTL_HOURS * 3600 * 1000).toISOString())
      .maybeSingle();

    if (cached?.analysis) {
      const raw = cached.analysis;
      const text =
        typeof raw === "string"
          ? raw
          : raw && typeof raw === "object" && "explanation" in raw
            ? String((raw as { explanation?: string }).explanation ?? "")
            : "";
      if (text.trim()) {
        return { ok: true, explanation: text.trim() };
      }
    }

    const { isPro, userId } = await getAIPlanState();
    const modelId = resolveTaskModel("matching", isPro);

    const { model, usageEventId } = await startAIUsageRequest({
      route: "digimytch/explain-match",
      userId,
      isPro,
      config: { model: modelId, apiKeys: [] },
    });

    const prompt = [
      `Offre : ${job.position_title} chez ${job.company_name}.`,
      `Score de compatibilité : ${match.score} %.`,
      `Mots-clés reconnus : ${match.matchedKeywords.slice(0, 15).join(", ") || "aucun"}.`,
      `Mots-clés manquants : ${match.missingKeywords.slice(0, 15).join(", ") || "aucun"}.`,
      `Compétences couvertes : ${match.matchedSkills.slice(0, 12).join(", ") || "aucune"}.`,
      `Écarts de compétences : ${match.gapSkills.slice(0, 12).join(", ") || "aucun"}.`,
      `Réponds en 2 à 3 phrases courtes maximum : pourquoi ce score, un point fort, une action prioritaire (sans inventer d'expérience).`,
    ].join("\n");

    const { text, usage } = await generateText({
      model,
      system:
        "Tu es un conseiller carrière de Digimytch Talent Hub (Tunisie). Réponds uniquement en français, ton professionnel et bienveillant. Ne mentionne aucun autre produit logiciel.",
      prompt,
      maxTokens: 180,
    });

    await finishAIUsageRequest({
      usageEventId,
      status: "succeeded",
      usage,
    });

    const explanation = text?.trim();
    if (!explanation) {
      return { ok: false, error: "Réponse vide de l'assistant." };
    }

    await supabase
      .from("job_analysis_cache")
      .upsert({ job_hash: jobHash, analysis: explanation })
      .then(({ error }) => {
        if (error && process.env.NODE_ENV === "development") {
          console.warn("[explainJobMatch] cache upsert skipped:", error.message);
        }
      });

    return { ok: true, explanation };
  } catch (error) {
    return { ok: false, error: friendlyAIErrorMessage(error) };
  }
}
