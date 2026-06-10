/**
 * Digimytch Talent Hub (PFE) product mode.
 * Par défaut activé dans ce dépôt. Définir NEXT_PUBLIC_DIGIMYTCH_TALENT_HUB=0
 * pour désactiver le mode Talent Hub.
 */

// Cached constant — read once at module load, not on every call.
export const IS_DIGIMYTCH_TALENT_HUB =
  process.env.NEXT_PUBLIC_DIGIMYTCH_TALENT_HUB !== "0";

/** @deprecated Use IS_DIGIMYTCH_TALENT_HUB constant directly. */
export function isDigimytchTalentHub(): boolean {
  return IS_DIGIMYTCH_TALENT_HUB;
}

/**
 * Check whether the authenticated user is an admin.
 *
 * Security model (layered):
 *   1. Primary: app_metadata.is_admin === true in the Supabase JWT
 *      (set server-side via service role — cannot be forged by users).
 *   2. Fallback for self-hosted/dev: SEED_ADMIN_EMAIL env var.
 *      The default "admin@admin.com" is refused in production.
 */
export function isAdminUser(
  userOrEmail?:
    | { email?: string | null; app_metadata?: Record<string, unknown> }
    | string
    | null
): boolean {
  if (!userOrEmail) return false;

  // Full Supabase User object — check JWT claim first
  if (typeof userOrEmail === "object") {
    const meta = userOrEmail.app_metadata;
    if (meta && meta.is_admin === true) return true;
    return isAdminEmail(userOrEmail.email);
  }

  // Legacy: called with raw email string
  return isAdminEmail(userOrEmail);
}

/** Email-only admin check (dev/self-hosted fallback). Refuses production default. */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const seedEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  // Prevent accidental admin access in production if env var is the default value
  if (
    process.env.NODE_ENV === "production" &&
    (!seedEmail || seedEmail === "admin@admin.com")
  ) {
    return false;
  }
  if (!seedEmail) return false;
  return email.toLowerCase() === seedEmail;
}
