import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { atsGapAnalysisSchema, atsGapRequestSchema } from "./ats-gap-schema";

describe("atsGapAnalysisSchema", () => {
  it("accepts a valid ATS gap payload", () => {
    const result = atsGapAnalysisSchema.safeParse({
      overall_ats_score: 62,
      sections: {
        summary: { score: 70, present: ["React"], missing: ["TypeScript"] },
        experience: { score: 55, present: ["Java"], missing: ["Spring"] },
        skills: { score: 80, present: ["SQL"], missing: [] },
        education: { score: 40, missing: ["Master"] },
      },
      critical_missing: ["Kubernetes"],
      quick_wins: ["Git", "Agile", "REST"],
    });
    assert.equal(result.success, true);
  });

  it("rejects scores above 100", () => {
    const result = atsGapAnalysisSchema.safeParse({
      overall_ats_score: 120,
      sections: {
        summary: { score: 0, present: [], missing: [] },
        experience: { score: 0, present: [], missing: [] },
        skills: { score: 0, present: [], missing: [] },
        education: { score: 0, missing: [] },
      },
      critical_missing: [],
      quick_wins: [],
    });
    assert.equal(result.success, false);
  });
});

describe("atsGapRequestSchema", () => {
  it("requires at least 40 characters of job description", () => {
    const result = atsGapRequestSchema.safeParse({
      cv_content: { skills: [] },
      job_description: "court",
    });
    assert.equal(result.success, false);
  });
});
