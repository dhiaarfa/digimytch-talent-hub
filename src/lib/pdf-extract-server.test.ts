import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { extractPdfTextFromBuffer } from "./pdf-extract-server";

describe("extractPdfTextFromBuffer", () => {
  it("extracts text from a valid PDF fixture", async () => {
    const fixture = path.join(
      process.cwd(),
      "node_modules",
      "pdf-parse",
      "test",
      "data",
      "01-valid.pdf"
    );
    const buffer = fs.readFileSync(fixture);
    const text = await extractPdfTextFromBuffer(buffer);
    assert.ok(text.length > 100);
    assert.match(text, /Trace-based/i);
  });

});
