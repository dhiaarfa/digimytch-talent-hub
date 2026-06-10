"use server";



import { createClient } from "@/utils/supabase/server";

import { computeResumeJobMatch } from "@/lib/matching";

import type { Job, Profile, Resume } from "@/lib/types";

import { getCachedAuthUser } from "@/lib/server-auth";



export type DigimytchQuickStats = {

  hasResume: boolean;

  profileComplete: boolean;

  jobsCount: number;

  avgScore: number | null;

  activeApplications: number;

  gapSkillsCount: number;

  hasInterview: boolean;

};



const MAX_JOBS_FOR_AVG = 25;



function isProfileComplete(profile: Pick<Profile, "work_experience" | "education" | "skills"> | null): boolean {

  if (!profile) return false;

  return Boolean(

    profile.work_experience?.length ||

      profile.education?.length ||

      profile.skills?.length

  );

}



/** Lightweight dashboard stats (no full-page job match scan). */

export async function getDigimytchQuickStats(): Promise<DigimytchQuickStats | null> {

  const { user } = await getCachedAuthUser();

  if (!user) return null;



  const supabase = await createClient();



  const [profileRes, resumeRes, jobsCountRes, jobsSampleRes, appsRes, interviewRes] =

    await Promise.all([

      supabase

        .from("profiles")

        .select("work_experience, education, skills")

        .eq("user_id", user.id)

        .maybeSingle(),

      supabase

        .from("resumes")

        .select(

          "id, user_id, skills, work_experience, education, email, phone_number, first_name, last_name, professional_summary, projects"

        )

        .eq("user_id", user.id)

        .eq("is_base_resume", true)

        .is("deleted_at", null)

        .order("updated_at", { ascending: false })

        .limit(1)

        .maybeSingle(),

      supabase

        .from("jobs")

        .select("id", { count: "exact", head: true })

        .eq("user_id", user.id)

        .eq("is_active", true)

        .is("deleted_at", null),

      supabase

        .from("jobs")

        .select("id, user_id, company_name, position_title, keywords, description")

        .eq("user_id", user.id)

        .eq("is_active", true)

        .is("deleted_at", null)

        .order("created_at", { ascending: false })

        .limit(MAX_JOBS_FOR_AVG),

      supabase

        .from("job_applications")

        .select("status")

        .eq("user_id", user.id)

        .is("deleted_at", null),

      supabase

        .from("ai_usage_events")

        .select("id", { count: "exact", head: true })

        .eq("user_id", user.id)

        .eq("status", "succeeded")

        .like("route", "digimytch/interview%"),

    ]);



  const profile = profileRes.data as Pick<Profile, "work_experience" | "education" | "skills"> | null;

  const resume = resumeRes.data as Resume | null;

  const jobs = (jobsSampleRes.data ?? []) as Job[];

  const apps = appsRes.data ?? [];



  let avgScore: number | null = null;

  const gaps = new Set<string>();

  if (resume && jobs.length > 0) {

    const scores: number[] = [];

    for (const job of jobs) {

      const match = computeResumeJobMatch(resume, job);

      if (match.score >= 0) scores.push(match.score);

      match.gapSkills.forEach((g) => gaps.add(g));

      match.missingKeywords.forEach((g) => gaps.add(g));

    }

    if (scores.length > 0) {

      avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    }

  }



  const activeApplications = apps.filter(

    (a) => a.status !== "rejected" && a.status !== "accepted"

  ).length;



  return {

    hasResume: Boolean(resume),

    profileComplete: isProfileComplete(profile),

    jobsCount: jobsCountRes.count ?? 0,

    avgScore,

    activeApplications,

    gapSkillsCount: gaps.size,

    hasInterview: (interviewRes.count ?? 0) > 0,

  };

}

