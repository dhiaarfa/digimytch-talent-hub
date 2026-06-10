import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildJobEmbeddingText,
  buildResumeEmbeddingText,
  mockEmbeddingFromText,
} from "./embeddings-text";
import type { Job, Resume } from "./types";

const resume: Resume = {
  id: "r1",
  user_id: "u1",
  name: "CV",
  target_role: "Développeur React",
  is_base_resume: true,
  first_name: "A",
  last_name: "B",
  email: "a@b.com",
  work_experience: [
    { company: "X", position: "Ingénieur Frontend", date: "2024", description: [] },
    { company: "Y", position: "Dev React", date: "2022", description: [] },
  ],
  education: [],
  skills: [{ category: "Tech", items: ["React", "TypeScript"] }],
  projects: [],
  created_at: "",
  updated_at: "",
  has_cover_letter: false,
};

const job: Job = {
  id: "j1",
  user_id: "u1",
  company_name: "Co",
  position_title: "Ingénieur JavaScript Frontend",
  job_url: null,
  description: "React et TypeScript requis pour ce poste en équipe agile.",
  location: null,
  salary_range: null,
  keywords: ["react", "typescript"],
  work_location: "remote",
  employment_type: "full_time",
  created_at: "",
  updated_at: "",
  is_active: true,
};

describe("buildResumeEmbeddingText", () => {
  it("concatenates skills, titles and summary", () => {
    const text = buildResumeEmbeddingText(resume);
    assert.match(text, /React/);
    assert.match(text, /Ingénieur Frontend/);
    assert.match(text, /Développeur React/);
  });
});

describe("buildJobEmbeddingText", () => {
  it("concatenates title, skills and description excerpt", () => {
    const text = buildJobEmbeddingText(job);
    assert.match(text, /Ingénieur JavaScript Frontend/);
    assert.match(text, /react/);
    assert.ok(text.length <= 8000);
  });
});

describe("mockEmbeddingFromText", () => {
  it("returns a normalized 1536-dim vector", () => {
    const v = mockEmbeddingFromText("Développeur React");
    assert.equal(v.length, 1536);
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    assert.ok(Math.abs(norm - 1) < 0.01);
  });
});
