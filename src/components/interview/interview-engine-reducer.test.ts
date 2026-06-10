import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  initialInterviewEngineState,
  interviewEngineReducer,
  type InterviewEngineState,
} from "@/components/interview/interview-engine-reducer";

describe("interviewEngineReducer", () => {
  it("boot → assistant → speak → listen", () => {
    let s = initialInterviewEngineState;
    s = interviewEngineReducer(s, {
      type: "ASSISTANT_REPLY",
      content: "Bonjour, parlez-moi de vous.",
    });
    assert.equal(s.phase, "speaking");
    assert.equal(s.messages.length, 1);
    s = interviewEngineReducer(s, { type: "SPEAK_DONE" });
    assert.equal(s.phase, "listening");
  });

  it("submits user answer then processes", () => {
    let s: InterviewEngineState = {
      ...initialInterviewEngineState,
      phase: "listening",
      messages: [{ role: "assistant", content: "Q1" }],
    };
    s = interviewEngineReducer(s, { type: "SUBMIT_ANSWER", answer: "Ma réponse" });
    assert.equal(s.phase, "processing");
    assert.equal(s.userTurns, 1);
    assert.equal(s.pendingAnswer, "Ma réponse");
  });

  it("request finish requires at least one user turn", () => {
    const s = interviewEngineReducer(initialInterviewEngineState, {
      type: "REQUEST_FINISH",
    });
    assert.equal(s.phase, "booting");
    assert.equal(s.pendingAnswer, "");
  });

  it("cycles speaking → listening across multiple turns", () => {
    let s = interviewEngineReducer(initialInterviewEngineState, {
      type: "ASSISTANT_REPLY",
      content: "Question 1",
    });
    assert.equal(s.phase, "speaking");

    s = interviewEngineReducer(s, { type: "SPEAK_DONE" });
    assert.equal(s.phase, "listening");

    s = interviewEngineReducer(s, { type: "SUBMIT_ANSWER", answer: "Answer 1" });
    assert.equal(s.phase, "processing");
    assert.equal(s.userTurns, 1);

    s = interviewEngineReducer(s, {
      type: "ASSISTANT_REPLY",
      content: "Question 2",
    });
    assert.equal(s.phase, "speaking");
    assert.equal(s.messages.length, 3);

    s = interviewEngineReducer(s, { type: "SPEAK_DONE" });
    assert.equal(s.phase, "listening");
    assert.equal(s.liveTranscript, "");
    assert.equal(s.userTurns, 1);
  });

  it("returns to listening after a failed turn", () => {
    let s: InterviewEngineState = {
      ...initialInterviewEngineState,
      phase: "processing",
      messages: [
        { role: "assistant", content: "Q1" },
        { role: "user", content: "A1" },
      ],
      pendingAnswer: "A1",
      userTurns: 1,
    };
    s = interviewEngineReducer(s, { type: "TURN_FAILED", error: "timeout" });
    assert.equal(s.phase, "listening");
    assert.equal(s.pendingAnswer, "");
    assert.equal(s.error, "timeout");
  });
});
