-- Bind SECURITY DEFINER RPC to the authenticated caller (prevents user_id spoofing).

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
  p_user_id uuid := auth.uid();
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

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
