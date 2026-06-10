import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseResumeTextStructured } from "./resume-text-structured";

const SAMPLE = `
Mohamed Dhia Arfa
mohameddhiaarfa@gmail.com
+216 53 580 272
Tunis, Tunisia

Professional Summary
Data engineer with 5+ years building scalable pipelines and analytics platforms.

Professional Experience
Data Engineer | ABC Corp | 2022–Present
• Built ETL pipelines with Spark and Airflow
• Led migration to cloud data warehouse

Software Developer | XYZ Ltd | 2018-2020
• Developed REST APIs in Node.js
• Improved deployment time by 40%

Education
National School of Computer Science (ENSI), 2010–2014
Engineering Degree | Data Intelligence

Skills
Languages: Python, SQL, JavaScript
Tools: Spark, Airflow, Docker, Kubernetes
`;

describe("parseResumeTextStructured", () => {
  it("extracts contact info and multiple jobs", () => {
    const result = parseResumeTextStructured(SAMPLE);
    assert.equal(result.first_name, "Mohamed");
    assert.equal(result.last_name, "Dhia Arfa");
    assert.equal(result.email, "mohameddhiaarfa@gmail.com");
    assert.ok((result.work_experience?.length ?? 0) >= 3);
    const titles = (result.work_experience ?? []).map((w) => w.position);
    assert.ok(titles.some((t) => /Data Engineer/i.test(t)));
    assert.ok(titles.some((t) => /Software Developer/i.test(t)));
  });

  it("extracts education and skills", () => {
    const result = parseResumeTextStructured(SAMPLE);
    assert.ok((result.education?.length ?? 0) >= 1);
    assert.match(result.education?.[0]?.school ?? "", /ENSI/i);
    assert.ok((result.skills?.length ?? 0) >= 1);
    const allSkills = (result.skills ?? []).flatMap((s) => s.items);
    assert.ok(allSkills.some((s) => /Python/i.test(s)));
  });
});
