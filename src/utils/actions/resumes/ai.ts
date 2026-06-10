'use server';

// import { RESUME_IMPORTER_SYSTEM_MESSAGE, } from "@/lib/prompts";
import { Resume, WorkExperience } from "@/lib/types";
import { textImportSchema, workExperienceBulletPointsSchema, projectAnalysisSchema, workExperienceItemsSchema } from "@/lib/zod-schemas";
import { generateObject } from "ai";
import { z } from "zod";
import { type AIConfig } from '@/utils/ai-tools';
import { PROJECT_GENERATOR_MESSAGE, PROJECT_IMPROVER_MESSAGE, TEXT_ANALYZER_SYSTEM_MESSAGE, WORK_EXPERIENCE_GENERATOR_MESSAGE, WORK_EXPERIENCE_IMPROVER_MESSAGE, CV_FULL_IMPORT_SYSTEM_MESSAGE } from "@/lib/prompts";
import { getModelById, isDigimytchFreeModelId } from "@/lib/ai-models";
import { logPromptInjectionAttempt } from "@/lib/ai/usage-ledger";
import { runTrackedAIRequest } from "@/lib/ai/run-tracked-request";
import { sanitizeForPrompt } from "@/lib/prompt-security";
import {
  parseResumeTextStructured,
  type TextImportContent,
} from "@/lib/resume-text-structured";
import { isLocalDevMockAI } from "@/lib/ai/ci-mock-model";
import { logger } from "@/lib/logger";

import { getAIPlanState, resolveTaskModel } from "@/lib/ai/plan";

function resolveImportModel(config: AIConfig | undefined, isPro: boolean): string {
  const candidate = config?.model?.trim();
  if (!candidate) return resolveTaskModel("cv", isPro);
  if (getModelById(candidate) || isDigimytchFreeModelId(candidate)) return candidate;
  return resolveTaskModel("cv", isPro);
}

function isLowQualityImport(content: TextImportContent): boolean {
  const jobs = content.work_experience ?? [];
  if (jobs.length !== 1) return false;
  const only = jobs[0];
  return (
    /profil importé|import cv/i.test(only.position) ||
    /import cv/i.test(only.company) ||
    (only.description?.length ?? 0) > 25
  );
}

function coalesceImportContent(
  aiContent: TextImportContent,
  structured: TextImportContent
): TextImportContent {
  const aiJobs = aiContent.work_experience?.length ?? 0;
  const structJobs = structured.work_experience?.length ?? 0;

  const work_experience =
    isLowQualityImport(aiContent) || (structJobs > aiJobs && structJobs > 0)
      ? structured.work_experience
      : aiContent.work_experience?.length
        ? aiContent.work_experience
        : structured.work_experience;

  return {
    first_name: aiContent.first_name ?? structured.first_name,
    last_name: aiContent.last_name ?? structured.last_name,
    email: aiContent.email ?? structured.email,
    phone_number: aiContent.phone_number ?? structured.phone_number,
    location: aiContent.location ?? structured.location,
    website: aiContent.website ?? structured.website,
    linkedin_url: aiContent.linkedin_url ?? structured.linkedin_url,
    github_url: aiContent.github_url ?? structured.github_url,
    work_experience: work_experience ?? [],
    education:
      (aiContent.education?.length ?? 0) >= (structured.education?.length ?? 0)
        ? aiContent.education
        : structured.education,
    skills:
      (aiContent.skills?.length ?? 0) >= (structured.skills?.length ?? 0)
        ? aiContent.skills
        : structured.skills,
    projects:
      (aiContent.projects?.length ?? 0) >= (structured.projects?.length ?? 0)
        ? aiContent.projects
        : structured.projects,
  };
}

function mergeImportContent(
  existingResume: Resume,
  content: z.infer<typeof textImportSchema>
): Resume {
  return {
    ...existingResume,
    ...(content.first_name && { first_name: content.first_name }),
    ...(content.last_name && { last_name: content.last_name }),
    ...(content.email && { email: content.email }),
    ...(content.phone_number && { phone_number: content.phone_number }),
    ...(content.location && { location: content.location }),
    ...(content.website && { website: content.website }),
    ...(content.linkedin_url && { linkedin_url: content.linkedin_url }),
    ...(content.github_url && { github_url: content.github_url }),
    work_experience: [...existingResume.work_experience, ...(content.work_experience || [])],
    education: [
      ...existingResume.education,
      ...(content.education || []).map((entry) => ({
        school: entry.school,
        degree: entry.degree,
        field: entry.field ?? "",
        date: entry.date ?? "",
        ...(entry.location ? { location: entry.location } : {}),
        ...(entry.gpa ? { gpa: entry.gpa } : {}),
        ...(entry.achievements ? { achievements: entry.achievements } : {}),
      })),
    ],
    skills: [...existingResume.skills, ...(content.skills || [])],
    projects: [...existingResume.projects, ...(content.projects || [])],
  };
}

// Base Resume Creation
// TEXT CONTENT -> RESUME
export async function convertTextToResume(prompt: string, existingResume: Resume, targetRole: string, config?: AIConfig) {
  const { isPro, userId } = await getAIPlanState();
  const sanitizedResumeInput = sanitizeForPrompt(prompt);
  if (sanitizedResumeInput.detected || sanitizedResumeInput.wasTrimmed) {
    await logPromptInjectionAttempt({
      userId,
      route: "actions.resumes.convertTextToResume",
      details: `removed=${sanitizedResumeInput.removedFragments},trimmed=${sanitizedResumeInput.wasTrimmed}`,
    });
  }

  const structuredBaseline = parseResumeTextStructured(sanitizedResumeInput.text);

  if (isLocalDevMockAI()) {
    return mergeImportContent(existingResume, structuredBaseline);
  }

  const modelId = resolveImportModel(config, isPro);
  const resolvedConfig: AIConfig = {
    model: modelId,
    apiKeys: config?.apiKeys || [],
    ...(config?.customPrompts ? { customPrompts: config.customPrompts } : {}),
  };

  const structuredHint = JSON.stringify(structuredBaseline, null, 2).slice(0, 14_000);

  try {
    const result = await runTrackedAIRequest(
      {
        route: "actions.resumes.convertTextToResume",
        userId,
        isPro,
        config: resolvedConfig,
        useThinking: isPro,
      },
      (aiClient) =>
        generateObject({
          model: aiClient,
          schema: z.object({
            content: textImportSchema,
          }),
          system: CV_FULL_IMPORT_SYSTEM_MESSAGE,
          prompt: `TARGET_ROLE (keyword emphasis only, do not filter content): ${targetRole}

STRUCTURED_PARSE_HINT (refine and complete — keep separate entries per job/degree):
${structuredHint}

RAW_RESUME_TEXT:
${sanitizedResumeInput.text}`,
        })
    );
    const merged = coalesceImportContent(result.object.content, structuredBaseline);
    return mergeImportContent(existingResume, merged);
  } catch (error) {
    logger.warn("[convertTextToResume] AI failed, using structured parser", error);
    return mergeImportContent(existingResume, structuredBaseline);
  }
}



    // NEW WORK EXPERIENCE BULLET POINTS
    export async function generateWorkExperiencePoints(
      position: string,
      company: string,
      technologies: string[],
      targetRole: string,
      numPoints: number = 3,
      customPrompt: string = '',
      config?: AIConfig
    ) { 
      const { isPro, userId } = await getAIPlanState();
  
      // Use custom prompt if provided in config, otherwise fall back to default
      const systemPrompt = config?.customPrompts?.workExperienceGenerator 
        ?? (WORK_EXPERIENCE_GENERATOR_MESSAGE.content as string);

      const { object } = await runTrackedAIRequest({
        route: 'actions.resumes.generateWorkExperiencePoints',
        userId,
        isPro,
        config,
      }, (aiClient) => generateObject({
        model: aiClient,
        schema: z.object({
          content: workExperienceBulletPointsSchema
        }),
      prompt: `Position: ${position}
      Company: ${company}
      Technologies: ${technologies.join(', ')}
      Target Role: ${targetRole}
      Number of Points: ${numPoints}${customPrompt ? `\nCustom Focus: ${customPrompt}` : ''}`,
        system: systemPrompt,
      }));

      return object.content;
      }
    
      // WORK EXPERIENCE BULLET POINTS IMPROVEMENT
      export async function improveWorkExperience(point: string, customPrompt?: string, config?: AIConfig) {
          const { isPro, userId } = await getAIPlanState();
          
          // Use custom prompt if provided in config, otherwise fall back to default
          const systemPrompt = config?.customPrompts?.workExperienceImprover 
            ?? (WORK_EXPERIENCE_IMPROVER_MESSAGE.content as string);

          const { object } = await runTrackedAIRequest({
          route: 'actions.resumes.improveWorkExperience',
          userId,
          isPro,
          config,
          }, (aiClient) => generateObject({
          model: aiClient,
          
          schema: z.object({
              content: z.string().describe("The improved work experience bullet point")
          }),
          prompt: `Please improve this work experience bullet point while maintaining its core message and truthfulness${customPrompt ? `. Additional requirements: ${customPrompt}` : ''}:\n\n"${point}"`,
          system: systemPrompt,
          }));
      

          return object.content;
      }
    
      // PROJECT BULLET POINTS IMPROVEMENT
      export async function improveProject(point: string, customPrompt?: string, config?: AIConfig) {
          
          const { isPro, userId } = await getAIPlanState();

          // Use custom prompt if provided in config, otherwise fall back to default
          const systemPrompt = config?.customPrompts?.projectImprover 
            ?? (PROJECT_IMPROVER_MESSAGE.content as string);
  
          const { object } = await runTrackedAIRequest({
          route: 'actions.resumes.improveProject',
          userId,
          isPro,
          config,
          }, (aiClient) => generateObject({
          model: aiClient,
          schema: z.object({
              content: z.string().describe("The improved project bullet point")
          }),
          prompt: `Please improve this project bullet point while maintaining its core message and truthfulness${customPrompt ? `. Additional requirements: ${customPrompt}` : ''}:\n\n"${point}"`,
          system: systemPrompt,
          }));
      
          return object.content;
      }
      
      // NEW PROJECT BULLET POINTS
      export async function generateProjectPoints(
          projectName: string,
          technologies: string[],
          targetRole: string,
          numPoints: number = 3,
          customPrompt: string = '',
          config?: AIConfig
      ) {
          const { isPro, userId } = await getAIPlanState();
          
          // Use custom prompt if provided in config, otherwise fall back to default
          const systemPrompt = config?.customPrompts?.projectGenerator 
            ?? (PROJECT_GENERATOR_MESSAGE.content as string);

          const { object } = await runTrackedAIRequest({
          route: 'actions.resumes.generateProjectPoints',
          userId,
          isPro,
          config,
          }, (aiClient) => generateObject({
          model: aiClient,
          schema: z.object({
              content: projectAnalysisSchema
          }),
          prompt: `Project Name: ${projectName}
      Technologies: ${technologies.join(', ')}
      Target Role: ${targetRole}
      Number of Points: ${numPoints}${customPrompt ? `\nCustom Focus: ${customPrompt}` : ''}`,
          system: systemPrompt,
          }));
      
          return object.content;
      }
      
      // Text Import for profile
      export async function processTextImport(text: string, config?: AIConfig) {
          const { isPro, userId } = await getAIPlanState();
          
          // Use custom prompt if provided in config, otherwise fall back to default
          const systemPrompt = config?.customPrompts?.textAnalyzer 
            ?? (TEXT_ANALYZER_SYSTEM_MESSAGE.content as string);

          const { object } = await runTrackedAIRequest({
          route: 'actions.resumes.processTextImport',
          userId,
          isPro,
          config,
          }, (aiClient) => generateObject({
          model: aiClient,
          schema: z.object({
              content: textImportSchema
          }),
          prompt: text,
          system: systemPrompt,
          }));
      
          return object.content;
      }
      
      // WORK EXPERIENCE MODIFICATION
      export async function modifyWorkExperience(
          experience: WorkExperience[],
          prompt: string,
          config?: AIConfig
      ) {
          const { isPro, userId } = await getAIPlanState();
          
          const { object } = await runTrackedAIRequest({
          route: 'actions.resumes.modifyWorkExperience',
          userId,
          isPro,
          config,
          }, (aiClient) => generateObject({
          model: aiClient,
          schema: z.object({
              content: workExperienceItemsSchema
          }),
          prompt: `Please modify this work experience entry according to these instructions: ${prompt}\n\nCurrent work experience:\n${JSON.stringify(experience, null, 2)}`,
          system: `You are a professional resume writer. Modify the given work experience based on the user's instructions. 
          Maintain professionalism and accuracy while implementing the requested changes. 
          Keep the same company and dates, but modify other fields as requested.
          Use strong action verbs and quantifiable achievements where possible.`,
          }));
      
          return object.content;
      }
      
// ADDING TEXT CONTENT TO RESUME
export async function addTextToResume(prompt: string, existingResume: Resume, config?: AIConfig) {
  const { isPro, userId } = await getAIPlanState();
  const sanitized = sanitizeForPrompt(prompt);
  if (sanitized.detected || sanitized.wasTrimmed) {
    await logPromptInjectionAttempt({
      userId,
      route: "actions.resumes.addTextToResume",
      details: `removed=${sanitized.removedFragments},trimmed=${sanitized.wasTrimmed}`,
    });
  }

  const structuredBaseline = parseResumeTextStructured(sanitized.text);

  if (isLocalDevMockAI()) {
    return mergeImportContent(existingResume, structuredBaseline);
  }

  const fallbackModel = resolveTaskModel("cv", isPro);
  const modelId = resolveImportModel(config, isPro);
  const resolvedConfig: AIConfig = {
    model: modelId,
    apiKeys: config?.apiKeys || [],
    ...(config?.customPrompts ? { customPrompts: config.customPrompts } : {}),
  };

  const structuredHint = JSON.stringify(structuredBaseline, null, 2).slice(0, 14_000);

  const runExtraction = (model: string) =>
    runTrackedAIRequest(
      {
        route:
          model === modelId
            ? "actions.resumes.addTextToResume"
            : "actions.resumes.addTextToResume.fallback",
        userId,
        isPro,
        config: { ...resolvedConfig, model },
      },
      (aiClient) =>
        generateObject({
          model: aiClient,
          schema: z.object({ content: textImportSchema }),
          system: CV_FULL_IMPORT_SYSTEM_MESSAGE,
          prompt: `STRUCTURED_PARSE_HINT (refine and complete — separate entry per job/degree):
${structuredHint}

RAW_RESUME_TEXT:
${sanitized.text}`,
        })
    );

  try {
    const { object } = await runExtraction(modelId);
    const merged = coalesceImportContent(object.content, structuredBaseline);
    return mergeImportContent(existingResume, merged);
  } catch (error) {
    if (modelId !== fallbackModel) {
      try {
        const { object } = await runExtraction(fallbackModel);
        const merged = coalesceImportContent(object.content, structuredBaseline);
        return mergeImportContent(existingResume, merged);
      } catch (fallbackError) {
        logger.warn("[addTextToResume] AI fallback failed", fallbackError);
      }
    } else {
      logger.warn("[addTextToResume] AI failed", error);
    }

    return mergeImportContent(existingResume, structuredBaseline);
  }
}
