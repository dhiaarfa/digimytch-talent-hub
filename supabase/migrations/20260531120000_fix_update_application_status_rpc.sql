-- Fix ambiguous user_id in update_application_status (parameter vs column)

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
  p_user_id uuid := user_id;
BEGIN
  IF new_status NOT IN ('saved', 'applied', 'interview', 'rejected', 'accepted') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT ja.status INTO prev_status
  FROM public.job_applications ja
  WHERE ja.id = app_id AND ja.user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  UPDATE public.job_applications ja
  SET status = new_status,
      updated_at = timezone('utc'::text, now())
  WHERE ja.id = app_id AND ja.user_id = p_user_id;

  IF prev_status IS DISTINCT FROM new_status THEN
    INSERT INTO public.job_application_events(application_id, from_status, to_status)
    VALUES (app_id, prev_status, new_status);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_application_status(uuid, text, uuid) TO authenticated;
