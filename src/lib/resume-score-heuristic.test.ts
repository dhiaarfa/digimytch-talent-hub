import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHeuristicResumeScore } from "./resume-score-heuristic";
import type { Resume } from "./types";

const minimalResume: Resume = {
  id: "r1",
  user_id: "u1",
  name: "Test",
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@test.com",
  phone_number: "+21600000000",
  location: "Tunis",
  website: undefined,
  linkedin_url: undefined,
  github_url: undefined,
  work_experience: [
    {
      company: "Digimytch",
      position: "Dev",
      location: "Tunis",
      date: "2024",
      description: ["Shipped features"],
      technologies: ["React"],
    },
  ],
  education: [],
  skills: [{ category: "Tech", items: ["React", "TypeScript", "Node.js"] }],
  projects: [],
  has_cover_letter: false,
  is_base_resume: true,
  target_role: "Developer",
  created_at: "",
  updated_at: "",
};

describe("buildHeuristicResumeScore", () => {
  it("returns valid score metrics without AI", () => {
    const score = buildHeuristicResumeScore(minimalResume);
    assert.ok(score.overallScore.score >= 0 && score.overallScore.score <= 100);
    assert.match(score.overallScore.reason, /calculé localement/i);
  });
});
