-- Migration: Admin role management
-- Adds a secure server-side function to grant/revoke admin via app_metadata.
-- This cannot be called by regular users (SECURITY DEFINER + explicit caller check).

-- Function to grant admin role (call via service role only)
CREATE OR REPLACE FUNCTION public.set_admin_role(target_user_id uuid, grant_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow service role or existing admins to call this
  IF (auth.jwt() ->> 'role') NOT IN ('service_role') THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data =
    CASE
      WHEN grant_admin THEN
        COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
      ELSE
        COALESCE(raw_app_meta_data, '{}'::jsonb) - 'is_admin'
    END
  WHERE id = target_user_id;
END;
$$;

-- Seed admin from env if SEED_ADMIN_EMAIL matches an existing user
-- This runs on migration and is idempotent
DO $$
DECLARE
  v_admin_email text := current_setting('app.seed_admin_email', true);
  v_user_id uuid;
BEGIN
  IF v_admin_email IS NULL OR v_admin_email = '' OR v_admin_email = 'admin@admin.com' THEN
    -- Use the known seed email for local Docker setup only
    v_admin_email := 'admin@admin.com';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = lower(v_admin_email) LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
    WHERE id = v_user_id;
    RAISE NOTICE 'Admin role granted to %', v_admin_email;
  ELSE
    RAISE NOTICE 'Admin user % not found — skipping seed', v_admin_email;
  END IF;
END;
$$;
