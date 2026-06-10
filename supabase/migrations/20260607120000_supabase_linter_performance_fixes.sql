-- Supabase database linter: auth RLS initplan, duplicate indexes, overlapping policies.

-- 1. Auth RLS initplan: evaluate auth.uid() once per query, not per row.
DROP POLICY IF EXISTS subscriptions_policy ON public.subscriptions;
CREATE POLICY subscriptions_policy ON public.subscriptions
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS profiles_policy ON public.profiles;
CREATE POLICY profiles_policy ON public.profiles
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS job_application_events_select_own ON public.job_application_events;
CREATE POLICY job_application_events_select_own ON public.job_application_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = job_application_events.application_id
        AND ja.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS job_application_events_insert_own ON public.job_application_events;
CREATE POLICY job_application_events_insert_own ON public.job_application_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = job_application_events.application_id
        AND ja.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS candidate_feedback_insert_own ON public.candidate_feedback;
CREATE POLICY candidate_feedback_insert_own ON public.candidate_feedback
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS candidate_feedback_select_own ON public.candidate_feedback;
CREATE POLICY candidate_feedback_select_own ON public.candidate_feedback
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS loyalty_points_own ON public.loyalty_points;
CREATE POLICY loyalty_points_own ON public.loyalty_points
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS course_completions_own ON public.course_completions;
CREATE POLICY course_completions_own ON public.course_completions
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 2. Multiple permissive SELECT policies on job_analysis_cache (FOR ALL already covers SELECT).
DROP POLICY IF EXISTS job_analysis_cache_select_authenticated ON public.job_analysis_cache;

-- 3. Duplicate indexes (keep idx_* names from perf migration).
DROP INDEX IF EXISTS public.job_application_events_application_id_idx;
DROP INDEX IF EXISTS public.job_applications_user_id_idx;
