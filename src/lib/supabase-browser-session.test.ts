import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasSupabaseAuthCookie } from "./supabase-browser-session";

describe("hasSupabaseAuthCookie", () => {
  it("returns false when document is undefined", () => {
    assert.equal(hasSupabaseAuthCookie(), false);
  });
});
