import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isInternalAppPath,
  NAV_PROGRESS_HIDE_DELAY_MS,
  NAV_PROGRESS_SAFETY_TIMEOUT_MS,
  NAV_PROGRESS_SHOW_DELAY_MS,
  pathOnly,
  shouldShowNavProgress,
} from "./navigation-progress-utils";

describe("navigation progress utils", () => {
  it("uses fast show/hide delays (no long overlay waits)", () => {
    assert.ok(NAV_PROGRESS_SHOW_DELAY_MS <= 100);
    assert.equal(NAV_PROGRESS_HIDE_DELAY_MS, 0);
    assert.ok(NAV_PROGRESS_SAFETY_TIMEOUT_MS <= 15_000);
  });

  it("isInternalAppPath accepts app routes and rejects external URLs", () => {
    assert.equal(isInternalAppPath("/home"), true);
    assert.equal(isInternalAppPath("/jobs?tab=1"), true);
    assert.equal(isInternalAppPath("//evil.com"), false);
    assert.equal(isInternalAppPath("https://example.com"), false);
  });

  it("pathOnly strips query strings", () => {
    assert.equal(pathOnly("/jobs?foo=1"), "/jobs");
    assert.equal(pathOnly("/home"), "/home");
  });

  it("shouldShowNavProgress ignores same-path clicks and external links", () => {
    assert.equal(shouldShowNavProgress("/home", "/home"), false);
    assert.equal(shouldShowNavProgress("/home?x=1", "/home"), false);
    assert.equal(shouldShowNavProgress("/jobs", "/home"), true);
    assert.equal(shouldShowNavProgress("https://x.com", "/home"), false);
    assert.equal(shouldShowNavProgress(null, "/home"), false);
  });
});
