'use server';
import { generateObject, LanguageModelV1 } from 'ai';
import { z } from 'zod';
import { RESUME_FORMATTER_SYSTEM_MESSAGE } from "@/lib/prompts";
import { type AIConfig } from '@/utils/ai-tools';
import { getAIPlanState, resolveTaskModel } from '@/lib/ai/plan';
import { sanitizeUnknownStrings } from '@/lib/utils';
import { logPromptInjectionAttempt } from '@/lib/ai/usage-ledger';
import { runTrackedAIRequest } from '@/lib/ai/run-tracked-request';
import { sanitizeForPrompt } from '@/lib/prompt-security';

// TEXT RESUME -> PROFILE
export async function formatProfileWithAI(
  userMessages: string,
  config?: AIConfig
) {
    try {
      const { isPro, userId } = await getAIPlanState();
      const resolvedConfig = {
        model: resolveTaskModel('cv', isPro, config?.model),
        apiKeys: config?.apiKeys ?? [],
      };
      const sanitizedResumeText = sanitizeForPrompt(userMessages);
      if (sanitizedResumeText.detected || sanitizedResumeText.wasTrimmed) {
        await logPromptInjectionAttempt({
          userId,
          route: "actions.profiles.formatProfileWithAI",
          details: `removed=${sanitizedResumeText.removedFragments},trimmed=${sanitizedResumeText.wasTrimmed}`,
        });
      }
  
      
      const { object } = await runTrackedAIRequest({
        route: 'actions.profiles.formatProfileWithAI',
        userId,
        isPro,
        config: resolvedConfig,
      }, (aiClient) => generateObject({
        model: aiClient as LanguageModelV1,
        schema: z.object({
          content: z.object({
            first_name: z.string().optional(),
            last_name: z.string().optional(),
            email: z.string().optional(),
            phone_number: z.string().optional(),
            location: z.string().optional(),
            website: z.string().optional(),
            linkedin_url: z.string().optional(),
            github_url: z.string().optional(),
            work_experience: z.array(z.object({
              company: z.string(),
              position: z.string(),
              date: z.string(),
              location: z.string().optional(),
              description: z.array(z.string()),
              technologies: z.array(z.string()).optional()
            })).optional(),
            education: z.array(z.object({
              school: z.string(),
              degree: z.string(),
              field: z.string(),
              date: z.string(),
              location: z.string().optional(),
              gpa: z.string().optional(),
              achievements: z.array(z.string()).optional()
            })).optional(),
            skills: z.array(z.object({
              category: z.string(),
              items: z.array(z.string())
            })).optional(),
            projects: z.array(z.object({
              name: z.string(),
              description: z.array(z.string()),
              technologies: z.array(z.string()).optional(),
              date: z.string().optional(),
              url: z.string().optional(),
              github_url: z.string().optional()
            })).optional()
          })
        }),
        prompt: `Please analyze this resume text and extract all relevant information into a structured profile format. 
                Include all sections (personal info, work experience, education, skills, projects) if present.
                Ensure all arrays (like description, technologies, achievements) are properly formatted as arrays.
                For any missing or unclear information, use optional fields rather than making assumptions.
  
                Resume Text:
  ${sanitizedResumeText.text}`,
        // Use custom prompt if provided in config, otherwise fall back to default
        system: config?.customPrompts?.resumeFormatter 
          ?? (RESUME_FORMATTER_SYSTEM_MESSAGE.content as string),
      }));

  
      return sanitizeUnknownStrings(object.content);
    } catch (error) {
      throw error;
    }
  }
