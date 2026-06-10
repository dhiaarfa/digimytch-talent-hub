import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  getOpenRouterApiKey,
  hasOpenRouterServerKey,
} from "@/lib/openrouter-config";

describe("openrouter-config", () => {
  const original = process.env.OPENROUTER_API_KEY;

  afterEach(() => {
    if (original === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = original;
  });

  it("rejects placeholder keys", () => {
    process.env.OPENROUTER_API_KEY = "your_openrouter_key_here";
    assert.equal(getOpenRouterApiKey(), null);
    assert.equal(hasOpenRouterServerKey(), false);
  });

  it("accepts real-looking keys", () => {
    process.env.OPENROUTER_API_KEY =
      "sk-or-v1-" + "a".repeat(48);
    assert.ok(getOpenRouterApiKey());
    assert.equal(hasOpenRouterServerKey(), true);
  });
});
