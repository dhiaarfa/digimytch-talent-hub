import { LanguageModelV1, ToolInvocation, smoothStream, streamText } from 'ai';
import { logger } from '@/lib/logger';
import { Resume, Job } from '@/lib/types';
import { type AIConfig } from '@/utils/ai-tools';
import { coverLetterChatTools, resumeChatTools } from '@/lib/tools';
import { AI_ASSISTANT_SYSTEM_MESSAGE, DIGIMYTCH_AI_ASSISTANT_SHORT } from '@/lib/prompts';
import { IS_DIGIMYTCH_TALENT_HUB } from '@/lib/digimytch-config';
import { getAIPlanState, resolveTaskModel } from '@/lib/ai/plan';
import {
  AIUsageError,
  finishAIUsageRequest,
  logPromptInjectionAttempt,
  startAIUsageRequest,
} from '@/lib/ai/usage-ledger';
import { friendlyAIErrorMessage } from '@/lib/ai/plan';
import {
  getDigimytchModelFallbackChain,
  isOpenRouterModelNotFoundError,
} from '@/lib/digimytch-openrouter-models';
import { sanitizeForPrompt } from '@/lib/prompt-security';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolInvocation[];
}

interface ChatRequest {
  messages: Message[];
  resume: Resume;
  target_role: string;
  config?: AIConfig;
  job?: Job;
  /** When set, assistant focuses on cover letter editing only */
  focus?: 'cover_letter';
}

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const requestBody = await req.json();
    const { messages, target_role, config, job, resume, focus }: ChatRequest = requestBody;
    const isCoverLetterFocus = focus === 'cover_letter';
    const activeTools = isCoverLetterFocus ? coverLetterChatTools : resumeChatTools;

    const { isPro, userId: planUserId } = await getAIPlanState();
    if (!planUserId) {
      return new Response(JSON.stringify({ error: "Session expirée. Reconnectez-vous." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const id = planUserId;
    const preferredModel = resolveTaskModel("chat", isPro, config?.model);
    const resolvedConfig: AIConfig = {
      model: preferredModel,
      apiKeys: config?.apiKeys ?? [],
      ...(config?.customPrompts ? { customPrompts: config.customPrompts } : {}),
    };
    const modelChain = IS_DIGIMYTCH_TALENT_HUB
      ? getDigimytchModelFallbackChain(preferredModel)
      : [preferredModel];
    const safeTargetRole = sanitizeForPrompt(target_role ?? "");
    const safeJob = sanitizeForPrompt(job ? JSON.stringify(job) : "");
    const safeResumeSummary = sanitizeForPrompt(
      resume ? `${resume.first_name} ${resume.last_name} - ${resume.target_role}` : 'No resume data'
    );
    if (safeTargetRole.detected || safeJob.detected || safeResumeSummary.detected) {
      await logPromptInjectionAttempt({
        userId: id,
        route: "api.chat",
        details: `target_removed=${safeTargetRole.removedFragments},job_removed=${safeJob.removedFragments}`,
      });
    }

    let lastError: unknown;

    for (let chainIndex = 0; chainIndex < modelChain.length; chainIndex++) {
      const modelId = modelChain[chainIndex];
      const route =
        chainIndex === 0 ? "api.chat" : "api.chat.model_fallback";

      const {
        model: aiClient,
        usageEventId,
      } = await startAIUsageRequest({
        userId: id,
        route,
        config: { ...resolvedConfig, model: modelId },
        isPro,
      });

      try {
    // Some models (e.g., GPT-5 family / GPT-5 Mini) only support the default temperature (1)
    const requiresDefaultTemp = ['gpt-5-mini-2025-08-07', 'gpt-5', 'gpt-5.2', 'gpt-5.2-pro'].includes(modelId);
    
    // Gemini models support a thinking phase—explicitly disable it to avoid added latency/cost
    // For OpenRouter models, use the unified 'reasoning' parameter via providerOptions.openrouter
    const isGeminiModel = modelId.toLowerCase().includes('gemini');
    const isOpenRouterModel = modelId.includes('/');
    
    // Configure provider options based on model type
    type ProviderOptions = 
      | {
          openrouter: {
            reasoning: {
              exclude: boolean;
            };
          };
        }
      | {
          google: {
            thinkingConfig: {
              thinkingBudget: number;
              includeThoughts: boolean;
            };
          };
        }
      | undefined;
    
    let providerOptions: ProviderOptions = undefined;
    
    if (isGeminiModel) {
      if (isOpenRouterModel) {
        // OpenRouter models: use reasoning parameter via providerOptions.openrouter
        // Set exclude: true to disable reasoning tokens in response (model still thinks internally)
        providerOptions = {
          openrouter: {
            reasoning: {
              exclude: true,
            },
          },
        };
      } else {
        // Direct Google models: use provider-specific options
        providerOptions = {
          google: {
            thinkingConfig: {
              thinkingBudget: 0,
              includeThoughts: false,
            },
          },
        };
      }
    }

    // Use custom prompt if provided, otherwise fall back to default
    const baseSystemPrompt = config?.customPrompts?.aiAssistant
      ?? (IS_DIGIMYTCH_TALENT_HUB
        ? DIGIMYTCH_AI_ASSISTANT_SHORT
        : (AI_ASSISTANT_SYSTEM_MESSAGE.content as string));
    
    // Append context-specific information to the system prompt
    const letterFocusBlock = isCoverLetterFocus
      ? `
      MODE: LETTRE DE MOTIVATION UNIQUEMENT.
      - Répondez en français professionnel.
      - Utilisez getCoverLetter pour lire la lettre actuelle avant de modifier.
      - Utilisez suggest_cover_letter_improvement avec le texte complet en HTML (<p> par paragraphe).
      - Ne modifiez pas le CV (expériences, compétences) — uniquement la lettre.
      - Poste cible: ${safeTargetRole.text}. Offre: ${safeJob.text || 'non précisée'}.
      `
      : '';

    const resumeToolBlock = isCoverLetterFocus
      ? ''
      : `
      TOOL USAGE INSTRUCTIONS:
      1. For work experience improvements:
         - Use 'suggest_work_experience_improvement' with 'index' and 'improved_experience' fields
         - Always include company, position, date, and description
      
      2. For project improvements:
         - Use 'suggest_project_improvement' with 'index' and 'improved_project' fields
         - Always include name and description
      
      3. For skill improvements:
         - Use 'suggest_skill_improvement' with 'index' and 'improved_skill' fields
         - Only use for adding new or removing existing skills
      
      4. For education improvements:
         - Use 'suggest_education_improvement' with 'index' and 'improved_education' fields
         - Always include school, degree, field, and date
      
      5. For viewing resume sections:
         - Use 'getResume' with 'sections' array
         - Valid sections: 'all', 'personal_info', 'work_experience', 'education', 'skills', 'projects'

      6. For multiple section updates:
         - Use 'modifyWholeResume' when changing multiple sections at once

      Aim to use a maximum of 5 tools in one go, then confirm with the user if they would like you to continue.
      The target role is ${safeTargetRole.text}. The job is ${safeJob.text || 'No job specified'}.
      Current resume summary: ${safeResumeSummary.text || 'No resume data'}.
      `;

    const systemPrompt = `${baseSystemPrompt}
      ${letterFocusBlock}
      ${resumeToolBlock}
      `;

    // Build and send the AI call.
    const result = streamText({
      model: aiClient as LanguageModelV1,
      ...(requiresDefaultTemp ? { temperature: 1 } : {}),
      ...(providerOptions ? { providerOptions } : {}),
      system: systemPrompt,
      messages,
      maxSteps: 5,
      tools: activeTools,
      experimental_transform: smoothStream({
        delayInMs: 20, // optional: defaults to 10ms
        chunking: 'word', // optional: defaults to 'word'
      }),
      onFinish: async ({ usage }) => {
        await finishAIUsageRequest({
          usageEventId,
          status: 'succeeded',
          usage,
        });
      },
      onError: async ({ error }) => {
        await finishAIUsageRequest({
          usageEventId,
          status: 'failed',
          errorCode: error instanceof Error ? error.message : 'stream_error',
        });
      },
    });

    return result.toDataStreamResponse({
      sendUsage: false,
      getErrorMessage: error => friendlyAIErrorMessage(error),
    });
      } catch (error) {
        await finishAIUsageRequest({
          usageEventId,
          status: 'failed',
          errorCode: error instanceof Error ? error.message : 'stream_error',
        });
        lastError = error;
        if (
          IS_DIGIMYTCH_TALENT_HUB &&
          isOpenRouterModelNotFoundError(error) &&
          chainIndex < modelChain.length - 1
        ) {
          continue;
        }
        throw error;
      }
    }

    throw lastError ?? new Error('Chat IA indisponible');
  } catch (error) {
    logger.error('Error in chat route:', error);
    if (error instanceof AIUsageError) {
      const retryAfter = error.code === 'rate_limited'
        ? parseInt(error.message.match(/(\d+) seconds/)?.[1] ?? '60', 10)
        : undefined;

      return new Response(
        JSON.stringify({
          error: error.message,
          ...(retryAfter ? { expirationTimestamp: Date.now() + retryAfter * 1000 } : {}),
        }),
        {
          status: error.status,
          headers: {
            'Content-Type': 'application/json',
            ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}),
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: friendlyAIErrorMessage(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
