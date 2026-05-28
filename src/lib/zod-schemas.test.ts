import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resumeScoreSchema } from "./zod-schemas";

describe("resumeScoreSchema validation", () => {
  const validBase = {
    overallScore: { score: 80, reason: "ok" },
    completeness: {
      contactInformation: { score: 80, reason: "ok" },
      detailLevel: { score: 80, reason: "ok" },
    },
    impactScore: {
      activeVoiceUsage: { score: 80, reason: "ok" },
      quantifiedAchievements: { score: 80, reason: "ok" },
    },
    roleMatch: {
      skillsRelevance: { score: 80, reason: "ok" },
      experienceAlignment: { score: 80, reason: "ok" },
      educationFit: { score: 80, reason: "ok" },
    },
  };

  it("rejects score > 100", () => {
    assert.throws(() =>
      resumeScoreSchema.parse({
        ...validBase,
        overallScore: { score: 150, reason: "too high" },
      })
    );
  });

  it("rejects negative score", () => {
    assert.throws(() =>
      resumeScoreSchema.parse({
        ...validBase,
        overallScore: { score: -5, reason: "negative" },
      })
    );
  });
});
