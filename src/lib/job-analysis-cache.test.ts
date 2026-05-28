import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashJobListing } from "./job-analysis-cache";

describe("hashJobListing", () => {
  it("is stable for the same job fields", () => {
    const job = {
      position_title: "Dev Full Stack",
      company_name: "Digimytch",
      description: "React, Node",
      keywords: ["react", "node"],
    };
    assert.equal(hashJobListing(job), hashJobListing({ ...job }));
  });

  it("changes when description changes", () => {
    const base = {
      position_title: "Dev",
      company_name: "Co",
      description: "A",
    };
    assert.notEqual(
      hashJobListing(base),
      hashJobListing({ ...base, description: "B" })
    );
  });
});
