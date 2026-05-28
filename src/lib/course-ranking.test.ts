import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rankCoursesBySkillGaps } from "./course-ranking";
import type { Course } from "./types";

const courses: Course[] = [
  {
    id: "c1",
    title: "Docker",
    provider: "Digimytch",
    skills_targeted: ["docker", "devops"],
    level: "Intermédiaire",
    url: null,
    created_at: "",
  },
  {
    id: "c2",
    title: "Scrum",
    provider: "Digimytch",
    skills_targeted: ["scrum", "agile"],
    level: "Débutant",
    url: null,
    created_at: "",
  },
];

describe("rankCoursesBySkillGaps", () => {
  it("ranks courses with higher overlap first", () => {
    const ranked = rankCoursesBySkillGaps(courses, ["docker", "kubernetes"]);
    assert.equal(ranked[0]?.course.id, "c1");
    assert.ok(ranked[0]!.overlap >= 1);
  });

  it("returns generic rationale when no overlap", () => {
    const ranked = rankCoursesBySkillGaps(courses, ["java"]);
    assert.equal(ranked[0]?.overlap, 0);
    assert.match(ranked[0]?.rationale ?? "", /catalogue Digimytch/);
  });
});
