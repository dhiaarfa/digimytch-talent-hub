/**
 * Minimal logger that strips verbose output in production.
 * Use this instead of console.log throughout the codebase.
 */

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

export const logger = {
  /** Dev-only. Silenced in production. */
  debug: (...args: unknown[]) => {
    if (isDev || isTest) console.debug("[debug]", ...args);
  },
  /** Informational — shown in dev, silenced in production. */
  info: (...args: unknown[]) => {
    if (isDev) console.info("[info]", ...args);
  },
  /** Warnings — always shown. */
  warn: (...args: unknown[]) => {
    console.warn("[warn]", ...args);
  },
  /** Errors — always shown. */
  error: (...args: unknown[]) => {
    console.error("[error]", ...args);
  },
};
