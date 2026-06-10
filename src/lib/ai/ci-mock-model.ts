import type { LanguageModelV1 } from "ai";
import { isDigimytchTalentHub } from "@/lib/digimytch-config";
import { hasOpenRouterServerKey } from "@/lib/openrouter-config";

export function isCiMockAI(): boolean {
  return process.env.CI_MOCK_AI === "1";
}

/** Dev/PFE fallback when OpenRouter key is missing or still a placeholder. */
export function isLocalDevMockAI(): boolean {
  if (isCiMockAI()) return true;
  return (
    process.env.NODE_ENV === "development" &&
    isDigimytchTalentHub() &&
    !hasOpenRouterServerKey()
  );
}

const MOCK_TEXT =
  "[Mode démo] Réponse simulée — configurez OPENROUTER_API_KEY dans .env pour l'IA réelle.";

const MOCK_COVER_LETTER = `<p>Madame, Monsieur,</p>
<p>Je me permets de vous adresser ma candidature pour le poste visé. Mon parcours et mes compétences correspondent aux exigences de votre offre.</p>
<p>Au cours de mes expériences, j'ai développé une solide maîtrise des technologies mentionnées et une capacité à livrer des résultats concrets en équipe.</p>
<p>Je serais ravi(e) de vous rencontrer pour échanger sur ma motivation et ma contribution à vos projets.</p>
<p>Cordialement,</p>`;

const MOCK_INTERVIEW_QUESTION =
  "Bonjour. Pouvez-vous vous présenter brièvement et me parler de votre parcours ?";

export function getDevMockText(route?: string): string {
  if (route?.includes("coverLetter") || route?.includes("lettre")) {
    return MOCK_COVER_LETTER;
  }
  if (route?.includes("interview")) {
    return MOCK_INTERVIEW_QUESTION;
  }
  return MOCK_TEXT;
}

export function createCiMockModel(text = MOCK_TEXT): LanguageModelV1 {
  return {
    specificationVersion: "v1",
    provider: "ci-mock",
    modelId: "ci-mock",
    defaultObjectGenerationMode: "json",
    doGenerate: async () => ({
      text,
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
            textDelta: text,
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
