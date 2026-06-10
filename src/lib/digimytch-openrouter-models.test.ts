import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getDigimytchModelFallbackChain,
  isStructuredOutputFailure,
  normalizeDigimytchOpenRouterModelId,
} from "./digimytch-openrouter-models";

describe("digimytch-openrouter-models", () => {
  it("remaps deprecated free model ids", () => {
    assert.equal(
      normalizeDigimytchOpenRouterModelId("deepseek/deepseek-chat:free"),
      "openrouter/free"
    );
    assert.equal(
      normalizeDigimytchOpenRouterModelId("meta-llama/llama-4-maverick:free"),
      "meta-llama/llama-3.3-70b-instruct:free"
    );
  });

  it("detects generateObject parse failures", () => {
    assert.equal(
      isStructuredOutputFailure(new Error("No object generated: could not parse the response.")),
      true
    );
    assert.equal(isStructuredOutputFailure(new Error("network timeout")), false);
  });

  it("builds deduplicated fallback chain", () => {
    const chain = getDigimytchModelFallbackChain("moonshotai/kimi-k2.6:free");
    assert.equal(chain[0], "moonshotai/kimi-k2.6:free");
    assert.ok(chain.includes("openrouter/free"));
    assert.equal(new Set(chain).size, chain.length);
  });
});
