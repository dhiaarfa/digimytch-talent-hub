-- Soft delete (corbeille 30 jours) + réponses admin aux réclamations

ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_resumes_user_trash
  ON public.resumes (user_id, deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_user_trash
  ON public.jobs (user_id, deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_job_applications_user_trash
  ON public.job_applications (user_id, deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_courses_trash
  ON public.courses (deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

-- Réponses admin aux réclamations
ALTER TABLE public.candidate_feedback
  ADD COLUMN IF NOT EXISTS admin_reply text,
  ADD COLUMN IF NOT EXISTS admin_reply_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_replied_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open';

ALTER TABLE public.candidate_feedback
  DROP CONSTRAINT IF EXISTS candidate_feedback_status_check;

ALTER TABLE public.candidate_feedback
  ADD CONSTRAINT candidate_feedback_status_check
  CHECK (status IN ('open', 'replied', 'closed'));
