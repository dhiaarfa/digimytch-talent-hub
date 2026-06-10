-- Supabase database linter: remaining security/performance fixes.

-- 1. Function search_path (SECURITY: function_search_path_mutable).
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. Unindexed foreign keys on public tables (PERFORMANCE: unindexed_foreign_keys).
CREATE INDEX IF NOT EXISTS idx_candidate_feedback_admin_replied_by
  ON public.candidate_feedback (admin_replied_by);

CREATE INDEX IF NOT EXISTS idx_course_completions_course_id
  ON public.course_completions (course_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_resume_id
  ON public.job_applications (resume_id);

CREATE INDEX IF NOT EXISTS idx_resumes_job_id
  ON public.resumes (job_id);

-- 3. RLS enabled without policies on service-role-only tables (SECURITY: rls_enabled_no_policy).
-- Client roles are revoked; explicit deny documents intent and satisfies the linter.
CREATE POLICY ai_usage_events_deny_clients ON public.ai_usage_events
  FOR ALL TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY stripe_webhook_events_deny_clients ON public.stripe_webhook_events
  FOR ALL TO authenticated, anon
  USING (false)
  WITH CHECK (false);
