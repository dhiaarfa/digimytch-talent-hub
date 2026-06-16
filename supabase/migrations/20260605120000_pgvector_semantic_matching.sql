-- Semantic job–resume matching via pgvector (1536-dim, cosine / HNSW)
-- pgvector installs the `vector` type in the `public` schema (not `storage`)

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.jobs DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.resumes DROP COLUMN IF EXISTS embedding;

ALTER TABLE public.jobs
  ADD COLUMN embedding vector(1536);

ALTER TABLE public.resumes
  ADD COLUMN embedding vector(1536);

DROP INDEX IF EXISTS idx_jobs_embedding_hnsw;
DROP INDEX IF EXISTS idx_resumes_embedding_hnsw;

CREATE INDEX idx_jobs_embedding_hnsw
  ON public.jobs
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_resumes_embedding_hnsw
  ON public.resumes
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.match_jobs_semantic(
  p_user_id uuid,
  p_resume_embedding vector(1536),
  p_match_threshold float DEFAULT 0.25,
  p_match_count int DEFAULT 40
)
RETURNS TABLE (
  job_id uuid,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    j.id AS job_id,
    (1 - (j.embedding <=> p_resume_embedding))::float AS similarity
  FROM public.jobs j
  WHERE j.user_id = p_user_id
    AND j.is_active = true
    AND j.deleted_at IS NULL
    AND j.embedding IS NOT NULL
    AND (1 - (j.embedding <=> p_resume_embedding)) >= p_match_threshold
  ORDER BY j.embedding <=> p_resume_embedding
  LIMIT GREATEST(p_match_count, 1);
$$;

CREATE OR REPLACE FUNCTION public.job_resume_semantic_similarity(
  p_job_id uuid,
  p_resume_id uuid
)
RETURNS float
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT CASE
    WHEN j.embedding IS NULL OR r.embedding IS NULL THEN NULL
    ELSE (1 - (j.embedding <=> r.embedding))::float
  END
  FROM public.jobs j
  INNER JOIN public.resumes r ON r.id = p_resume_id AND r.user_id = j.user_id
  WHERE j.id = p_job_id
    AND j.deleted_at IS NULL
    AND r.deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.match_jobs_semantic(uuid, vector, float, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.job_resume_semantic_similarity(uuid, uuid) TO authenticated;
