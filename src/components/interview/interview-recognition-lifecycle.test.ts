import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getRecognitionEndAction,
  shouldRetryRecognitionAfterError,
} from "@/components/interview/interview-recognition-lifecycle";

describe("getRecognitionEndAction", () => {
  it("returns idle when session is closed", () => {
    assert.deepEqual(getRecognitionEndAction(false, "hello"), { type: "idle" });
  });

  it("restarts an empty session so turn 2+ can capture speech", () => {
    assert.deepEqual(getRecognitionEndAction(true, ""), { type: "restart" });
    assert.deepEqual(getRecognitionEndAction(true, " "), { type: "restart" });
  });

  it("keeps silence auto-submit alive and restarts when text exists", () => {
    assert.deepEqual(getRecognitionEndAction(true, "Ma réponse"), {
      type: "schedule_silence_submit_and_restart",
    });
  });
});

describe("shouldRetryRecognitionAfterError", () => {
  it("retries no-speech only while session is active", () => {
    assert.equal(shouldRetryRecognitionAfterError("no-speech", true), true);
    assert.equal(shouldRetryRecognitionAfterError("no-speech", false), false);
    assert.equal(shouldRetryRecognitionAfterError("network", true), false);
  });
});
