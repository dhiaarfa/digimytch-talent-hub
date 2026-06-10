import assert from "node:assert/strict";
import { test } from "node:test";
import { buildHeuristicLinkedInReport } from "./linkedin-report-heuristic";

test("buildHeuristicLinkedInReport returns valid shape", () => {
  const text = `
Jean Dupont
Développeur Full Stack
Experience
Digimytch - Stage PFE 2026
Education
ESPRIT
Skills
React, TypeScript, Node.js
About
Passionné par le produit et l'IA.
`;
  const report = buildHeuristicLinkedInReport(text, true);
  assert.ok(report.score >= 0 && report.score <= 100);
  assert.ok(report.strengths.length >= 1);
  assert.ok(report.recommendations.length >= 1);
  assert.ok(report.keywords.length >= 1);
});
