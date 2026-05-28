-- Images pour cartes formations et offres (URL publique, ex. Unsplash)

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS image_url text NULL;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS image_url text NULL;

COMMENT ON COLUMN public.courses.image_url IS 'URL illustration carte formation (16:9 recommandé)';
COMMENT ON COLUMN public.jobs.image_url IS 'URL illustration carte offre (16:10 recommandé)';
