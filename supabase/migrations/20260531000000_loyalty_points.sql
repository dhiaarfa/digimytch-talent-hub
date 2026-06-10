-- ============================================================
-- Loyalty Points System — Digimytch Talent Hub
-- ============================================================

-- 1. Add institution + is_digimytch columns to courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS institution text NULL,
  ADD COLUMN IF NOT EXISTS institution_logo_url text NULL,
  ADD COLUMN IF NOT EXISTS is_digimytch boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS loyalty_points_reward integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_hours integer NULL,
  ADD COLUMN IF NOT EXISTS certificate boolean NOT NULL DEFAULT false;

-- 2. Loyalty points table
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  total_earned integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT loyalty_points_pkey PRIMARY KEY (id),
  CONSTRAINT loyalty_points_user_id_key UNIQUE (user_id),
  CONSTRAINT loyalty_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- 3. Course completions (tracks which courses a user completed)
CREATE TABLE IF NOT EXISTS public.course_completions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  points_earned integer NOT NULL DEFAULT 0,
  CONSTRAINT course_completions_pkey PRIMARY KEY (id),
  CONSTRAINT course_completions_user_course UNIQUE (user_id, course_id),
  CONSTRAINT course_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT course_completions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses (id) ON DELETE CASCADE
);

-- 4. RLS policies
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY loyalty_points_own ON public.loyalty_points
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY course_completions_own ON public.course_completions
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 5. Function to add points when a Digimytch course is completed
CREATE OR REPLACE FUNCTION public.complete_digimytch_course(p_course_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_course record;
  v_already_completed boolean;
  v_new_points integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_course FROM courses WHERE id = p_course_id AND is_digimytch = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found or not a Digimytch course';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM course_completions WHERE user_id = v_user_id AND course_id = p_course_id
  ) INTO v_already_completed;

  IF v_already_completed THEN
    RETURN json_build_object('ok', false, 'error', 'Course already completed');
  END IF;

  INSERT INTO course_completions (user_id, course_id, points_earned)
  VALUES (v_user_id, p_course_id, v_course.loyalty_points_reward);

  INSERT INTO loyalty_points (user_id, points, total_earned)
  VALUES (v_user_id, v_course.loyalty_points_reward, v_course.loyalty_points_reward)
  ON CONFLICT (user_id) DO UPDATE
    SET points = loyalty_points.points + v_course.loyalty_points_reward,
        total_earned = loyalty_points.total_earned + v_course.loyalty_points_reward,
        updated_at = now();

  SELECT points INTO v_new_points FROM loyalty_points WHERE user_id = v_user_id;

  RETURN json_build_object(
    'ok', true,
    'points_earned', v_course.loyalty_points_reward,
    'total_points', v_new_points
  );
END;
$$;

-- 6. Update Digimytch courses seed data with institutions + loyalty points
UPDATE public.courses SET
  institution = 'Digimytch Academy',
  institution_logo_url = '/digimytch-logo.png',
  is_digimytch = true,
  loyalty_points_reward = 150,
  certificate = true
WHERE provider = 'Digimytch';

-- 7. Add institutions to known providers
UPDATE public.courses SET institution = 'Google', institution_logo_url = '/logos/google.png'
  WHERE provider ILIKE '%google%';
UPDATE public.courses SET institution = 'Meta', institution_logo_url = '/logos/meta.png'
  WHERE provider ILIKE '%meta%' OR provider ILIKE '%facebook%';
UPDATE public.courses SET institution = 'Microsoft', institution_logo_url = '/logos/microsoft.webp'
  WHERE provider ILIKE '%microsoft%';
UPDATE public.courses SET institution = 'Amazon / AWS', institution_logo_url = '/logos/amazon.png'
  WHERE provider ILIKE '%amazon%' OR provider ILIKE '%aws%';

-- 8. Trigger for updated_at on loyalty_points
CREATE TRIGGER update_loyalty_points_updated_at
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
