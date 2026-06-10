import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { jobClipRequestSchema } from "./job-clip";

describe("jobClipRequestSchema", () => {
  it("accepts a valid clip payload", () => {
    const result = jobClipRequestSchema.safeParse({
      title: "Développeur React",
      company: "Acme",
      description: "Nous recherchons un développeur React avec TypeScript.",
      source_url: "https://www.linkedin.com/jobs/view/123",
      initial_status: "saved",
    });
    assert.equal(result.success, true);
  });

  it("rejects short descriptions", () => {
    const result = jobClipRequestSchema.safeParse({
      title: "Dev",
      description: "court",
      initial_status: "saved",
    });
    assert.equal(result.success, false);
  });
});
