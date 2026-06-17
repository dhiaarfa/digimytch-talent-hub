'use server'
import { logger } from '@/lib/logger';

import { createClient } from "@/utils/supabase/server";
import { Profile, Resume, WorkExperience, Education, Skill, Project, Job } from "@/lib/types";
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { simplifiedResumeSchema } from "@/lib/zod-schemas";
import { AIConfig } from "@/utils/ai-tools";
import { computeResumeScore } from "@/lib/resume-score-service";
import { toJsonSafeScore } from "@/lib/resume-score-payload";
import { getSubscriptionAccessState } from "@/lib/subscription-access";
import {
  FREE_PLAN_RESUME_LIMITS,
  getResumeLimitExceededMessage,
  type ResumeLimitType,
} from "@/lib/resume-limits";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { queueResumeEmbedding } from "@/utils/actions/embeddings/actions";
import {
  captureServerAnalyticsEvent,
  getSubscriptionAnalyticsProperties,
} from "@/lib/analytics/server";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";

async function assertResumeQuota(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  type: ResumeLimitType
) {
  if (IS_DIGIMYTCH_TALENT_HUB) {
    return;
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('subscription_plan, subscription_status, current_period_end, trial_end, stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (subscriptionError) {
    throw new Error('Failed to validate subscription access');
  }

  const accessState = getSubscriptionAccessState(subscription);
  if (accessState.hasProAccess) {
    return;
  }

  const isBaseResume = type === 'base';
  const { count, error: countError } = await supabase
    .from('resumes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_base_resume', isBaseResume)
    .is('deleted_at', null);

  if (countError) {
    throw new Error('Failed to validate resume limits');
  }

  const limit = FREE_PLAN_RESUME_LIMITS[type];
  if ((count ?? 0) >= limit) {
    throw new Error(getResumeLimitExceededMessage(type));
  }
}

//  SUPABASE ACTIONS
export async function getResumeById(resumeId: string): Promise<{ resume: Resume; profile: Profile; job: Job | null }> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }

  try {
    const [resumeResult, profileResult] = await Promise.all([
      supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single(),
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
    ]);

    if (resumeResult.error || !resumeResult.data) {
      throw new Error('Resume not found');
    }

    if (profileResult.error || !profileResult.data) {
      throw new Error('Profile not found');
    }

    let job: Job | null = null;

    if (resumeResult.data.job_id) {
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', resumeResult.data.job_id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (jobError) {
        logger.error('Failed to fetch associated job:', jobError);
      } else {
        job = jobData;
      }
    }

    return { 
      resume: resumeResult.data, 
      profile: profileResult.data,
      job
    };
  } catch (error) {
    throw error;
  }
}

export async function updateResume(resumeId: string, data: Partial<Resume>): Promise<Resume> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }

  const { data: resume, error: updateError } = await supabase
    .from('resumes')
    .update(data)
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) {
    throw new Error('Failed to update resume');
  }

  void queueResumeEmbedding(resumeId);

  if ('name' in data) {
    revalidatePath('/resumes');
    revalidatePath('/', 'layout');
  }

  return resume;
}

export async function deleteResume(resumeId: string): Promise<void> {
    const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }

  try {
    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('id, name, job_id, is_base_resume')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !resume) {
      throw new Error('Resume not found or access denied');
    }

    const deletedAt = new Date().toISOString();

    if (!resume.is_base_resume && resume.job_id) {
      const { error: jobDeleteError } = await supabase
        .from('jobs')
        .update({ deleted_at: deletedAt })
        .eq('id', resume.job_id)
        .eq('user_id', user.id);

      if (jobDeleteError) {
        logger.error('Failed to soft-delete associated job:', jobDeleteError);
      }
    }

    const { error: deleteError } = await supabase
      .from('resumes')
      .update({ deleted_at: deletedAt })
      .eq('id', resumeId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw new Error('Failed to delete resume');
    }

    revalidatePath('/', 'layout');
    revalidatePath('/resumes', 'layout');
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/resumes/base', 'layout');
    revalidatePath('/resumes/tailored', 'layout');
    revalidatePath('/jobs', 'layout');
    revalidatePath('/corbeille');

  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to delete resume');
  }
}

export async function createBaseResume(
  name: string, 
  importOption: 'import-profile' | 'fresh' | 'import-resume' = 'import-profile',
  selectedContent?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    location?: string;
    website?: string;
    linkedin_url?: string;
    github_url?: string;
    work_experience: WorkExperience[];
    education: Education[];
    skills: Skill[];
    projects: Project[];
  }
): Promise<Resume> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }

  await assertResumeQuota(supabase, user.id, 'base');

  let profile = null;
  if (importOption !== 'fresh') {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError) {
      logger.error('Profile fetch error:', profileError);
    }
    profile = data;
  }

  const newResume: Partial<Resume> = {
    user_id: user.id,
    name,
    target_role: name,
    is_base_resume: true,
    first_name: importOption === 'import-resume' ? selectedContent?.first_name || '' : importOption === 'fresh' ? '' : profile?.first_name || '',
    last_name: importOption === 'import-resume' ? selectedContent?.last_name || '' : importOption === 'fresh' ? '' : profile?.last_name || '',
    email: importOption === 'import-resume' ? selectedContent?.email || '' : importOption === 'fresh' ? '' : profile?.email || '',
    phone_number: importOption === 'import-resume' ? selectedContent?.phone_number || '' : importOption === 'fresh' ? '' : profile?.phone_number || '',
    location: importOption === 'import-resume' ? selectedContent?.location || '' : importOption === 'fresh' ? '' : profile?.location || '',
    website: importOption === 'import-resume' ? selectedContent?.website || '' : importOption === 'fresh' ? '' : profile?.website || '',
    linkedin_url: importOption === 'import-resume' ? selectedContent?.linkedin_url || '' : importOption === 'fresh' ? '' : profile?.linkedin_url || '',
    github_url: importOption === 'import-resume' ? selectedContent?.github_url || '' : importOption === 'fresh' ? '' : profile?.github_url || '',
    work_experience: (importOption === 'import-profile' || importOption === 'import-resume') && selectedContent 
      ? selectedContent.work_experience
      : [],
    education: (importOption === 'import-profile' || importOption === 'import-resume') && selectedContent
      ? selectedContent.education
      : [],
    skills: (importOption === 'import-profile' || importOption === 'import-resume') && selectedContent
      ? selectedContent.skills
      : [],
    projects: (importOption === 'import-profile' || importOption === 'import-resume') && selectedContent
      ? selectedContent.projects
      : [],
    section_order: [
      'work_experience',
      'education',
      'skills',
      'projects',
    ],
    section_configs: {
      work_experience: { visible: (selectedContent?.work_experience?.length ?? 0) > 0 },
      education: { visible: (selectedContent?.education?.length ?? 0) > 0 },
      skills: { visible: (selectedContent?.skills?.length ?? 0) > 0 },
      projects: { visible: (selectedContent?.projects?.length ?? 0) > 0 },
    },
    document_settings: {
      header_name_size: 24,
      skills_margin_top: 0,
      document_font_size: 10,
      projects_margin_top: 0,
      skills_item_spacing: 0,
      document_line_height: 1.2,
      education_margin_top: 0,
      skills_margin_bottom: 2,
      experience_margin_top: 2,
      projects_item_spacing: 0,
      education_item_spacing: 0,
      projects_margin_bottom: 0,
      education_margin_bottom: 0,
      experience_item_spacing: 1,
      document_margin_vertical: 20,
      experience_margin_bottom: 0,
      skills_margin_horizontal: 0,
      document_margin_horizontal: 28,
      header_name_bottom_spacing: 16,
      projects_margin_horizontal: 0,
      education_margin_horizontal: 0,
      experience_margin_horizontal: 0
    }
  };

  const { data: resume, error: createError } = await supabase
    .from('resumes')
    .insert([newResume])
    .select()
    .single();

  if (createError) {
    logger.error('\nDatabase Insert Error:', {
      code: createError.code,
      message: createError.message,
      details: createError.details,
      hint: createError.hint
    });
    throw new Error(`Failed to create resume: ${createError.message}`);
  }

  if (!resume) {
    logger.error('\nNo resume data returned after insert');
    throw new Error('Resume creation failed: No data returned');
  }

  await captureServerAnalyticsEvent({
    distinctId: user.id,
    event: AnalyticsEvents.ResumeCreated,
    properties: {
      ...(await getSubscriptionAnalyticsProperties(supabase, user.id)),
      resume_type: "base",
      has_job: false,
    },
  });

  revalidatePath("/resumes");
  revalidatePath("/home");

  void queueResumeEmbedding(resume.id);

  return resume;
}

export async function createTailoredResume(
  baseResume: Resume,
  jobId: string | null,
  jobTitle: string,
  companyName: string,
  tailoredContent: z.infer<typeof simplifiedResumeSchema>
) {
  logger.debug('[createTailoredResume] Received jobId:', jobId);
  logger.debug('[createTailoredResume] baseResume ID:', baseResume?.id);
  logger.debug('[createTailoredResume] Is jobId valid UUID?:', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId || ''));

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  await assertResumeQuota(supabase, user.id, 'tailored');

  const newResume = {
    ...tailoredContent,
    user_id: user.id,
    job_id: jobId,
    is_base_resume: false,
    first_name: baseResume.first_name,
    last_name: baseResume.last_name,
    email: baseResume.email,
    phone_number: baseResume.phone_number,
    location: baseResume.location,
    website: baseResume.website,
    linkedin_url: baseResume.linkedin_url,
    github_url: baseResume.github_url,
    document_settings: baseResume.document_settings,
    section_configs: baseResume.section_configs,
    section_order: baseResume.section_order,
    resume_title: `${jobTitle} at ${companyName}`,
    name: `${jobTitle} at ${companyName}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('resumes')
    .insert([newResume])
    .select()
    .single();

  if (error) throw error;
  await captureServerAnalyticsEvent({
    distinctId: user.id,
    event: AnalyticsEvents.ResumeTailored,
    properties: {
      ...(await getSubscriptionAnalyticsProperties(supabase, user.id)),
      resume_type: "tailored",
      has_job: Boolean(jobId),
    },
  });

  return data;
}

export async function copyResume(resumeId: string): Promise<Resume> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }

  const { data: sourceResume, error: fetchError } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !sourceResume) {
    throw new Error('Resume not found or access denied');
  }

  await assertResumeQuota(supabase, user.id, sourceResume.is_base_resume ? 'base' : 'tailored');

  // Exclude auto-generated fields that shouldn't be copied
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, created_at: _created_at, updated_at: _updated_at, ...resumeDataToCopy } = sourceResume;

  const newResume = {
    ...resumeDataToCopy,
    name: `${sourceResume.name} (Copy)`,
    user_id: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: copiedResume, error: createError } = await supabase
    .from('resumes')
    .insert([newResume])
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to copy resume: ${createError.message}`);
  }

  if (!copiedResume) {
    throw new Error('Resume creation failed: No data returned');
  }

  revalidatePath('/', 'layout');
  revalidatePath('/resumes', 'layout');
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/resumes/base', 'layout');
  revalidatePath('/resumes/tailored', 'layout');

  return copiedResume;
}

export async function countResumes(type: 'base' | 'tailored' | 'all'): Promise<number> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }

  let query = supabase
    .from('resumes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (type !== 'all') {
    query = query.eq('is_base_resume', type === 'base');
  }

  const { count, error: countError } = await query;

  if (countError) {
    throw new Error('Failed to count resumes');
  }

  return count || -1;
}


/** @deprecated Prefer POST /api/resume-score — long AI runs exceed Server Action limits. */
export async function generateResumeScore(
  resume: Resume,
  job?: Job | null,
  config?: AIConfig
) {
  const { score } = await computeResumeScore(resume, job, config);
  return toJsonSafeScore(score);
}
