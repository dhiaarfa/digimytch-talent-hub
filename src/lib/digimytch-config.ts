/**
 * Digimytch Talent Hub (PFE) product mode.
 * Par défaut **activé** dans ce dépôt (PFE). Définir `NEXT_PUBLIC_DIGIMYTCH_TALENT_HUB=0`
 * pour désactiver le mode Talent Hub (paywall / marque d’origine du fork).
 */
export function isDigimytchTalentHub(): boolean {
  return process.env.NEXT_PUBLIC_DIGIMYTCH_TALENT_HUB !== "0";
}

/** Comptes administrateurs (catalogue formations, import IA, stats). */
export function isAdminUser(email?: string | null): boolean {
  const adminEmails = [
    (process.env.SEED_ADMIN_EMAIL || "admin@admin.com").toLowerCase(),
  ];
  return !!email && adminEmails.includes(email.toLowerCase());
}
