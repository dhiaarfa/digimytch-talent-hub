import { streamText, generateText, type LanguageModelV1 } from "ai";
import { getSubscriptionPlan } from "@/utils/actions/stripe/actions";
import { selectBestModelForTask } from "@/lib/ai-models";
import { isDigimytchTalentHub } from "@/lib/digimytch-config";
import {
  AIUsageError,
  finishAIUsageRequest,
  startAIUsageRequest,
} from "@/lib/ai/usage-ledger";

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantRequest = {
  messages: AssistantMessage[];
  system?: string;
  model?: string;
  maxTokens?: number;
  stream?: boolean;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AssistantRequest;
    const { messages, system, maxTokens = 300, stream = true } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { plan, id } = await getSubscriptionPlan(true);
    const isPro = isDigimytchTalentHub() ? true : plan === "pro";
    const userId = id ?? "guest-assistant";

    const modelId =
      body.model ||
      (isDigimytchTalentHub()
        ? selectBestModelForTask("chat")
        : selectBestModelForTask("chat"));

    const { model, usageEventId } = await startAIUsageRequest({
      userId,
      route: "api.assistant",
      config: { model: modelId, apiKeys: [] },
      isPro,
    });

    if (stream) {
      const result = streamText({
        model: model as LanguageModelV1,
        system: system ?? "Tu es l'assistant Digimytch Talent Hub.",
        messages,
        maxTokens,
        onFinish: async ({ usage }) => {
          await finishAIUsageRequest({
            usageEventId,
            status: "succeeded",
            usage,
          });
        },
        onError: async ({ error }) => {
          await finishAIUsageRequest({
            usageEventId,
            status: "failed",
            errorCode: error instanceof Error ? error.message : "stream_error",
          });
        },
      });

      return result.toTextStreamResponse();
    }

    const { text, usage } = await generateText({
      model: model as LanguageModelV1,
      system: system ?? "Tu es l'assistant Digimytch Talent Hub.",
      messages,
      maxTokens,
    });

    await finishAIUsageRequest({
      usageEventId,
      status: "succeeded",
      usage,
    });

    return Response.json({ text: text?.trim() ?? "" });
  } catch (error) {
    console.error("[api/assistant]", error);
    if (error instanceof AIUsageError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erreur assistant",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
