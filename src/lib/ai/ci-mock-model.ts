import type { LanguageModelV1 } from "ai";

export function isCiMockAI(): boolean {
  return process.env.CI_MOCK_AI === "1";
}

const MOCK_TEXT =
  "[CI mock] Réponse simulée — aucun appel OpenRouter effectué.";

export function createCiMockModel(): LanguageModelV1 {
  return {
    specificationVersion: "v1",
    provider: "ci-mock",
    modelId: "ci-mock",
    defaultObjectGenerationMode: "json",
    doGenerate: async () => ({
      text: MOCK_TEXT,
      finishReason: "stop",
      usage: { promptTokens: 1, completionTokens: 8 },
      rawCall: { rawPrompt: null, rawSettings: {} },
      warnings: [],
    }),
    doStream: async () => ({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({
            type: "text-delta",
            textDelta: MOCK_TEXT,
          });
          controller.enqueue({
            type: "finish",
            finishReason: "stop",
            usage: { promptTokens: 1, completionTokens: 8 },
          });
          controller.close();
        },
      }),
      rawCall: { rawPrompt: null, rawSettings: {} },
      warnings: [],
    }),
  };
}
