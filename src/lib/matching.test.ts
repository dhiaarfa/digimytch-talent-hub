import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blendHybridScore, computeResumeJobMatch } from "./matching";
import { formatResumeDate } from "./utils";
import type { Job, Resume } from "./types";

const baseResume: Resume = {
  id: "r1",
  user_id: "u1",
  name: "Base",
  target_role: "Full Stack Developer",
  is_base_resume: true,
  first_name: "A",
  last_name: "B",
  email: "a@b.com",
  work_experience: [
    {
      company: "X",
      position: "Dev",
      date: "2024",
      description: ["Built APIs with node and react"],
      technologies: ["react", "node.js"],
    },
  ],
  education: [],
  skills: [{ category: "Lang", items: ["typescript", "sql"] }],
  projects: [],
  created_at: "",
  updated_at: "",
  has_cover_letter: false,
};

const job: Job = {
  id: "j1",
  user_id: "u1",
  company_name: "Co",
  position_title: "Full Stack Engineer",
  job_url: null,
  description: "We need react typescript and docker",
  location: null,
  salary_range: null,
  keywords: ["react", "typescript", "docker"],
  work_location: "remote",
  employment_type: "full_time",
  created_at: "",
  updated_at: "",
  is_active: true,
};

describe("computeResumeJobMatch", () => {
  it("returns score between 0 and 100", () => {
    const m = computeResumeJobMatch(baseResume, job);
    assert.ok(m.score >= 0 && m.score <= 100);
    assert.ok(m.matchedKeywords.includes("react") || m.matchedKeywords.includes("typescript"));
    assert.ok(m.missingKeywords.includes("docker"));
  });

  it("returns 0 when job input is empty", () => {
    const emptyJob: Job = {
      ...job,
      position_title: "",
      description: "",
      keywords: [],
    };
    const m = computeResumeJobMatch(baseResume, emptyJob);
    assert.equal(m.score, 0);
  });

  it("handles C# and .NET normalization", () => {
    const resumeCSharp: Resume = {
      ...baseResume,
      skills: [{ category: "Lang", items: ["C#", ".NET"] }],
      work_experience: [],
    };
    const csharpJob: Job = {
      ...job,
      position_title: "C# .NET backend",
      description: "C# developer .NET",
      keywords: ["C#", ".NET"],
    };
    const m = computeResumeJobMatch(resumeCSharp, csharpJob);
    assert.ok(m.score > 50);
  });

  it("matches JavaScript and JS synonyms", () => {
    const jsResume: Resume = {
      ...baseResume,
      skills: [{ category: "Lang", items: ["JavaScript"] }],
      work_experience: [],
    };
    const jsJob: Job = {
      ...job,
      position_title: "JS developer",
      description: "Looking for JS developer",
      keywords: ["JS"],
    };
    const m = computeResumeJobMatch(jsResume, jsJob);
    assert.ok(m.score > 60);
  });

  it("matches React and React.js with senior bonus", () => {
    const reactResume: Resume = {
      ...baseResume,
      skills: [{ category: "Frontend", items: ["React"] }],
      work_experience: [
        {
          company: "X",
          position: "Senior React Developer",
          date: "2020-2025",
          description: ["5 ans React en production"],
          technologies: ["React"],
        },
      ],
    };
    const reactJob: Job = {
      ...job,
      position_title: "React.js senior",
      description: "React.js senior engineer",
      keywords: ["React.js"],
    };
    const m = computeResumeJobMatch(reactResume, reactJob);
    assert.ok(m.score > 70);
  });

  it("does not throw when resume text contains phone country codes", () => {
    const resumeWithPhone: Resume = {
      ...baseResume,
      phone_number: "+216 53 580 272",
      work_experience: [
        {
          company: "Co",
          position: "Engineer",
          date: "2022",
          description: ["Reach me at +216 53 580 272", "5 ans Python"],
          technologies: ["python"],
        },
      ],
    };
    assert.doesNotThrow(() => computeResumeJobMatch(resumeWithPhone, job));
    const m = computeResumeJobMatch(resumeWithPhone, job);
    assert.ok(m.score >= 0 && m.score <= 100);
  });
});

describe("blendHybridScore", () => {
  it("weights semantic 60% and deterministic 40%", () => {
    assert.equal(blendHybridScore(1, 100), 100);
    assert.equal(blendHybridScore(0, 100), 40);
    assert.equal(blendHybridScore(0.5, 50), Math.round((0.5 * 0.6 + 0.5 * 0.4) * 100));
  });

  it("clamps inputs to valid ranges", () => {
    assert.equal(blendHybridScore(2, 150), 100);
    assert.equal(blendHybridScore(-1, -10), 0);
  });
});

describe("formatResumeDate", () => {
  it("formats ISO dates as DD/MM/YYYY without locale drift", () => {
    assert.equal(formatResumeDate("2026-05-18T12:00:00.000Z"), "18/05/2026");
  });

  it("returns empty string for invalid input", () => {
    assert.equal(formatResumeDate(undefined), "");
    assert.equal(formatResumeDate("invalid"), "");
  });
});
