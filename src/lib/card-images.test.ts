import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  suggestCourseImageUrl,
  suggestJobImageUrl,
  resolveJobImage,
  listPinnedCourseImageUrls,
  listPinnedJobImageUrls,
} from "./card-images";
import { PLATFORM_JOB_CATALOG } from "./platform-jobs-catalog";

describe("card-images", () => {
  it("assigns distinct images for key platform jobs", () => {
    const flutter = suggestJobImageUrl(
      "Développeur mobile Flutter",
      "Beekeeper",
      ["flutter", "dart", "mobile"]
    );
    const qa = suggestJobImageUrl(
      "Ingénieur QA / Test automation",
      "Proxym Group",
      ["selenium", "cypress"]
    );
    assert.notEqual(flutter, qa);
    assert.match(flutter, /unsplash\.com/);
  });

  it("does not map Flutter REST keyword to cybersecurity", () => {
    const img = resolveJobImage({
      position_title: "Développeur mobile Flutter",
      company_name: "Beekeeper",
      keywords: ["flutter", "dart", "mobile", "rest", "firebase"],
      image_url: null,
      work_location: "remote",
    });
    assert.doesNotMatch(img.src, /1614064641938/);
    assert.match(img.src, /unsplash\.com/);
  });

  it("pins every platform catalogue job", () => {
    const pinned = new Set(listPinnedJobImageUrls().map((j) => j.position_title));
    for (const job of PLATFORM_JOB_CATALOG) {
      assert.ok(pinned.has(job.position_title), `missing pin: ${job.position_title}`);
    }
  });

  it("covers core demo courses", () => {
    const titles = new Set(listPinnedCourseImageUrls().map((c) => c.title));
    assert.ok(titles.has("Parcours Full-Stack JavaScript"));
    assert.ok(titles.has("Scrum & gestion de projet agile"));
    assert.ok(titles.has("Optimiser son CV pour les ATS"));
  });

  it("uses different images for negotiation vs LinkedIn branding", () => {
    const negotiation = suggestCourseImageUrl("Négociation salariale (marché tunisien)", [
      "negotiation",
    ]);
    const linkedin = suggestCourseImageUrl("Personal branding LinkedIn", ["linkedin"]);
    assert.notEqual(negotiation, linkedin);
  });
});
