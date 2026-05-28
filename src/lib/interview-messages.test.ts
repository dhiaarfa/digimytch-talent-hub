import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { trimInterviewMessages } from "./interview-messages";

describe("trimInterviewMessages", () => {
  it("returns all messages when under limit", () => {
    const msgs = Array.from({ length: 4 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `m${i}`,
    }));
    assert.equal(trimInterviewMessages(msgs).length, 4);
  });

  it("keeps only the last 8 messages", () => {
    const msgs = Array.from({ length: 12 }, (_, i) => ({
      role: "user" as const,
      content: `m${i}`,
    }));
    const trimmed = trimInterviewMessages(msgs);
    assert.equal(trimmed.length, 8);
    assert.equal(trimmed[0]?.content, "m4");
    assert.equal(trimmed[7]?.content, "m11");
  });
});
