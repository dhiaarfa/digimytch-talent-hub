import { generateText } from "ai";
import type { LanguageModelV1 } from "ai";
import { startAIUsageRequest, finishAIUsageRequest } from "@/lib/ai/usage-ledger";

const OCR_PROMPT = `Extract ALL text from this CV/resume image. Return the raw text exactly as it appears, preserving structure (sections, bullet points, dates). Do not summarize or analyze — just extract every word.`;

export async function extractCvTextFromImage(input: {
  base64: string;
  mimeType: string;
  userId: string;
  isPro: boolean;
}): Promise<string> {
  const { model, usageEventId } = await startAIUsageRequest({
    userId: input.userId,
    route: "api.ocr-cv",
    config: { model: "google/gemma-4-26b-a4b-it:free", apiKeys: [] },
    isPro: input.isPro,
  });

  try {
    const { text, usage } = await generateText({
      model: model as LanguageModelV1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: `data:${input.mimeType};base64,${input.base64}`,
            },
            { type: "text", text: OCR_PROMPT },
          ],
        },
      ],
      maxTokens: 3000,
    });

    await finishAIUsageRequest({ usageEventId, status: "succeeded", usage });
    return text.trim();
  } catch (error) {
    await finishAIUsageRequest({
      usageEventId,
      status: "failed",
      errorCode: error instanceof Error ? error.message : "ocr_failed",
    });
    throw error;
  }
}
