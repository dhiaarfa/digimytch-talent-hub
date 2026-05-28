-- Digimytch Talent Hub: catalogue formations + suivi candidatures (PostgreSQL / Supabase)
-- Réf. cahier des charges DIGI-PFE-2026-02

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  provider text NOT NULL,
  skills_targeted text[] NOT NULL DEFAULT '{}'::text[],
  level text NOT NULL DEFAULT 'Intermédiaire',
  url text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT courses_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL,
  resume_id uuid NULL,
  status text NOT NULL DEFAULT 'saved'::text,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT job_applications_pkey PRIMARY KEY (id),
  CONSTRAINT job_applications_user_job UNIQUE (user_id, job_id),
  CONSTRAINT job_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT job_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT job_applications_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes (id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT job_applications_status_check CHECK (
    status = ANY (ARRAY['saved'::text, 'applied'::text, 'interview'::text, 'rejected'::text, 'accepted'::text])
  )
);

CREATE TABLE IF NOT EXISTS public.job_application_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  application_id uuid NOT NULL,
  from_status text NULL,
  to_status text NOT NULL,
  note text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT job_application_events_pkey PRIMARY KEY (id),
  CONSTRAINT job_application_events_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.job_applications (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS job_applications_user_id_idx ON public.job_applications USING btree (user_id);
CREATE INDEX IF NOT EXISTS job_applications_job_id_idx ON public.job_applications USING btree (job_id);
CREATE INDEX IF NOT EXISTS job_application_events_application_id_idx ON public.job_application_events USING btree (application_id);

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY courses_read_authenticated ON public.courses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY job_applications_select_own ON public.job_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY job_applications_insert_own ON public.job_applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY job_applications_update_own ON public.job_applications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY job_applications_delete_own ON public.job_applications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY job_application_events_select_own ON public.job_application_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = job_application_events.application_id AND ja.user_id = auth.uid()
    )
  );

CREATE POLICY job_application_events_insert_own ON public.job_application_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = job_application_events.application_id AND ja.user_id = auth.uid()
    )
  );

GRANT SELECT ON TABLE public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_applications TO authenticated;
GRANT SELECT, INSERT ON TABLE public.job_application_events TO authenticated;

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Parcours Full-Stack JavaScript', 'Digimytch Academy', ARRAY['react','node.js','typescript','sql'], 'Intermédiaire', 'https://example.org/courses/fullstack-js'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Parcours Full-Stack JavaScript');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Fondamentaux PostgreSQL & SQL', 'OpenClassrooms', ARRAY['sql','postgresql','database'], 'Débutant', 'https://example.org/courses/sql-postgres'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Fondamentaux PostgreSQL & SQL');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Docker & déploiement cloud', 'Digimytch Academy', ARRAY['docker','devops','ci/cd'], 'Intermédiaire', 'https://example.org/courses/docker'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Docker & déploiement cloud');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'API REST & sécurité (Node.js)', 'Digimytch Academy', ARRAY['rest','api','security','nodejs'], 'Avancé', 'https://example.org/courses/rest-security'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'API REST & sécurité (Node.js)');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Introduction à l’IA générative pour développeurs', 'Digimytch Academy', ARRAY['ai','llm','prompt engineering'], 'Débutant', 'https://example.org/courses/genai-dev'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Introduction à l’IA générative pour développeurs');

INSERT INTO public.courses (title, provider, skills_targeted, level, url)
SELECT 'Scrum & gestion de projet agile', 'Digimytch Academy', ARRAY['scrum','agile','project management'], 'Débutant', 'https://example.org/courses/scrum'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Scrum & gestion de projet agile');
