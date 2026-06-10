export const CANDIDATE_ROUTE_PREFIXES = [
  "/home",
  "/resumes",
  "/score-cv",
  "/jobs",
  "/formations",
  "/candidatures",
  "/entretiens",
  "/profile",
  "/linkedin",
] as const;

export function isCandidateRoute(pathname: string): boolean {
  return CANDIDATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export const ADMIN_ROUTE_PREFIX = "/admin";

export function isAdminRoute(pathname: string): boolean {
  return pathname === ADMIN_ROUTE_PREFIX || pathname.startsWith(`${ADMIN_ROUTE_PREFIX}/`);
}
