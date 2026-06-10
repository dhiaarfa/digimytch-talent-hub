CREATE TABLE IF NOT EXISTS public.candidate_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text,
  category text NOT NULL CHECK (category IN ('rating', 'complaint', 'suggestion')),
  rating smallint CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  experience_choice text CHECK (
    experience_choice IS NULL OR experience_choice IN ('excellent', 'good', 'average', 'poor')
  ),
  message text,
  page_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS candidate_feedback_created_idx
  ON public.candidate_feedback (created_at DESC);

CREATE INDEX IF NOT EXISTS candidate_feedback_user_idx
  ON public.candidate_feedback (user_id, created_at DESC);

ALTER TABLE public.candidate_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY candidate_feedback_insert_own
  ON public.candidate_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY candidate_feedback_select_own
  ON public.candidate_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON TABLE public.candidate_feedback FROM anon;
GRANT SELECT, INSERT ON TABLE public.candidate_feedback TO authenticated;
GRANT ALL ON TABLE public.candidate_feedback TO service_role;
