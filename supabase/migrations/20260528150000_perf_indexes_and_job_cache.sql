-- Performance indexes + job analysis cache + atomic status update RPC

CREATE TABLE IF NOT EXISTS public.job_analysis_cache (
  job_hash text PRIMARY KEY,
  analysis jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id_active ON public.jobs(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_application_events_application_id
  ON public.job_application_events(application_id);

CREATE OR REPLACE FUNCTION public.update_application_status(
  app_id uuid,
  new_status text,
  user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_status text;
BEGIN
  IF new_status NOT IN ('saved', 'applied', 'interview', 'rejected', 'accepted') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT status INTO prev_status
  FROM public.job_applications
  WHERE id = app_id AND job_applications.user_id = user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  UPDATE public.job_applications
  SET status = new_status,
      updated_at = timezone('utc'::text, now())
  WHERE id = app_id AND user_id = user_id;

  IF prev_status IS DISTINCT FROM new_status THEN
    INSERT INTO public.job_application_events(application_id, from_status, to_status)
    VALUES (app_id, prev_status, new_status);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_application_status(uuid, text, uuid) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_courses_level ON public.courses(level);

ALTER TABLE public.job_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_analysis_cache_select_authenticated ON public.job_analysis_cache
  FOR SELECT TO authenticated USING (true);

CREATE POLICY job_analysis_cache_upsert_authenticated ON public.job_analysis_cache
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON TABLE public.job_analysis_cache TO authenticated;
