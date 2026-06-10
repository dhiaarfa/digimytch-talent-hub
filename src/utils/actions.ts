'use server'

import { createClient } from "@/utils/supabase/server";
import { Profile, ResumeSummary } from "@/lib/types";
import { getCachedAuthUser } from "@/lib/server-auth";

interface DashboardData {
  profile: Profile | null;
  baseResumes: ResumeSummary[];
  tailoredResumes: ResumeSummary[];
}

const DASHBOARD_QUERY_TIMEOUT_MS = 5_000;

async function withDashboardTimeout<T>(promise: PromiseLike<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`DASHBOARD_TIMEOUT:${label}`)),
        DASHBOARD_QUERY_TIMEOUT_MS
      );
    }),
  ]);
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const { user, unavailable } = await getCachedAuthUser();

  if (unavailable) {
    throw new Error("SUPABASE_UNAVAILABLE");
  }

  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    // Fetch profile data
    let profile;
    const { data, error: profileError } = await withDashboardTimeout(
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      "profile"
    );
    
    profile = data;

    // If profile doesn't exist, create one
    if (profileError?.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          user_id: user.id,
          first_name: null,
          last_name: null,
          email: user.email,
          phone_number: null,
          location: null,
          website: null,
          linkedin_url: null,
          github_url: null,
          work_experience: [],
          education: [],
          skills: [],
          projects: [],
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        throw new Error('Error creating user profile');
      }

      profile = newProfile;
    } else if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Error fetching dashboard data');
    }

    // Fetch resumes data
    const { data: resumes, error: resumesError } = await withDashboardTimeout(
      supabase
        .from('resumes')
        .select(
          'id, user_id, name, target_role, is_base_resume, job_id, has_cover_letter, created_at, updated_at'
        )
        .eq('user_id', user.id)
        .is('deleted_at', null),
      "resumes"
    );

    if (resumesError) {
      console.error('Error fetching resumes:', resumesError);
      throw new Error('Error fetching dashboard data');
    }

    const sanitizedResumes =
      resumes?.map((resume) => ({
        ...resume,
        target_role: resume.target_role || '',
      })) ?? [];

    const baseResumes = sanitizedResumes.filter((resume) => resume.is_base_resume);
    const tailoredResumes = sanitizedResumes.filter((resume) => !resume.is_base_resume);

    return {
      profile,
      baseResumes,
      tailoredResumes,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'User not authenticated') {
      return {
        profile: null,
        baseResumes: [],
        tailoredResumes: []
      };
    }
    throw error;
  }
}



