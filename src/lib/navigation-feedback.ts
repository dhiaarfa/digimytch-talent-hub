export const DIGI_NAV_START = "digi-nav-start";

export function emitNavigationStart(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DIGI_NAV_START, { detail: { message } })
  );
}
