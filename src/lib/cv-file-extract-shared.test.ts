import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectCvFileType } from "./cv-file-extract-shared";

describe("detectCvFileType", () => {
  it("detects PDF", () => {
    assert.equal(
      detectCvFileType({ type: "application/pdf", name: "cv.pdf" }),
      "pdf"
    );
  });

  it("detects docx", () => {
    assert.equal(
      detectCvFileType({
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        name: "cv.docx",
      }),
      "word"
    );
  });

  it("rejects legacy .doc", () => {
    assert.equal(
      detectCvFileType({ type: "application/msword", name: "cv.doc" }),
      "unknown"
    );
  });

  it("detects images", () => {
    assert.equal(
      detectCvFileType({ type: "image/png", name: "scan.png" }),
      "image"
    );
  });
});
