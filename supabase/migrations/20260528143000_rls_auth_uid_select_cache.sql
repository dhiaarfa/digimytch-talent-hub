-- Hardened RLS predicates to avoid row-by-row auth.uid() calls.
-- Note: courses has no user_id column and interview_sessions table is absent in this schema.

DROP POLICY IF EXISTS resumes_policy ON public.resumes;
CREATE POLICY resumes_policy ON public.resumes
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS jobs_policy ON public.jobs;
CREATE POLICY jobs_policy ON public.jobs
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS job_applications_select_own ON public.job_applications;
CREATE POLICY job_applications_select_own ON public.job_applications
  FOR SELECT TO authenticated
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS job_applications_insert_own ON public.job_applications;
CREATE POLICY job_applications_insert_own ON public.job_applications
  FOR INSERT TO authenticated
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS job_applications_update_own ON public.job_applications;
CREATE POLICY job_applications_update_own ON public.job_applications
  FOR UPDATE TO authenticated
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS job_applications_delete_own ON public.job_applications;
CREATE POLICY job_applications_delete_own ON public.job_applications
  FOR DELETE TO authenticated
  USING (((SELECT auth.uid()) = user_id));
