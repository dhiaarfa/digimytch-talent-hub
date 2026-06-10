-- Require deleted_at IS NULL on INSERT; keep SELECT/UPDATE/DELETE for trash restore/purge.

DROP POLICY IF EXISTS resumes_policy ON public.resumes;
CREATE POLICY resumes_select_own ON public.resumes
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY resumes_insert_own ON public.resumes
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND deleted_at IS NULL);
CREATE POLICY resumes_update_own ON public.resumes
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY resumes_delete_own ON public.resumes
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS jobs_policy ON public.jobs;
CREATE POLICY jobs_select_own ON public.jobs
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY jobs_insert_own ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND deleted_at IS NULL);
CREATE POLICY jobs_update_own ON public.jobs
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY jobs_delete_own ON public.jobs
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS job_applications_insert_own ON public.job_applications;
CREATE POLICY job_applications_insert_own ON public.job_applications
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND deleted_at IS NULL);
