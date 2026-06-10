/** Pure helpers for Digimytch route-change progress UI (unit-testable). */

export const NAV_PROGRESS_SHOW_DELAY_MS = 60;
export const NAV_PROGRESS_HIDE_DELAY_MS = 0;
export const NAV_PROGRESS_SAFETY_TIMEOUT_MS = 12_000;

export function isInternalAppPath(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

export function pathOnly(href: string): string {
  try {
    return href.split("?")[0] || href;
  } catch {
    return href;
  }
}

/** True when an in-app link click should show the navigation progress bar. */
export function shouldShowNavProgress(
  href: string | null | undefined,
  currentPathname: string
): boolean {
  if (!href || !isInternalAppPath(href)) return false;
  return pathOnly(href) !== currentPathname;
}
