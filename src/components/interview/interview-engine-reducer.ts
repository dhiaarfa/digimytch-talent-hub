import type { InterviewMessage } from "@/lib/interview-simulator";
import { INTERVIEW_MAX_TURNS } from "@/lib/interview-simulator";

export type InterviewPhase =
  | "booting"
  | "listening"
  | "processing"
  | "speaking"
  | "complete"
  | "error";

export interface InterviewEngineState {
  phase: InterviewPhase;
  messages: InterviewMessage[];
  /** Live STT buffer while listening */
  liveTranscript: string;
  /** Question being spoken */
  currentQuestion: string;
  /** User answer being sent to LLM */
  pendingAnswer: string;
  debrief: string | null;
  error: string | null;
  userTurns: number;
}

export const initialInterviewEngineState: InterviewEngineState = {
  phase: "booting",
  messages: [],
  liveTranscript: "",
  currentQuestion: "",
  pendingAnswer: "",
  debrief: null,
  error: null,
  userTurns: 0,
};

export type InterviewEngineAction =
  | { type: "BOOT_FAILED"; error: string }
  | { type: "ASSISTANT_REPLY"; content: string }
  | { type: "START_SPEAKING" }
  | { type: "SPEAK_DONE" }
  | { type: "START_LISTENING" }
  | { type: "UPDATE_TRANSCRIPT"; live: string }
  | { type: "SUBMIT_ANSWER"; answer: string }
  | { type: "TURN_FAILED"; error: string }
  | { type: "DEBRIEF_READY"; content: string }
  | { type: "REQUEST_FINISH" }
  | { type: "CLEAR_ERROR" };

function countUserTurns(messages: InterviewMessage[]) {
  return messages.filter((m) => m.role === "user").length;
}

export function interviewEngineReducer(
  state: InterviewEngineState,
  action: InterviewEngineAction
): InterviewEngineState {
  switch (action.type) {
    case "BOOT_FAILED":
      return { ...state, phase: "error", error: action.error };

    case "ASSISTANT_REPLY": {
      const messages: InterviewMessage[] = [
        ...state.messages,
        { role: "assistant", content: action.content },
      ];
      return {
        ...state,
        messages,
        currentQuestion: action.content,
        phase: "speaking",
        error: null,
      };
    }

    case "START_SPEAKING":
      return { ...state, phase: "speaking" };

    case "SPEAK_DONE": {
      if (state.userTurns >= INTERVIEW_MAX_TURNS) {
        return { ...state, phase: "processing", pendingAnswer: "__FINISH__" };
      }
      return {
        ...state,
        phase: "listening",
        liveTranscript: "",
        error: null,
      };
    }

    case "START_LISTENING":
      return { ...state, phase: "listening", liveTranscript: "", error: null };

    case "UPDATE_TRANSCRIPT":
      return { ...state, liveTranscript: action.live };

    case "SUBMIT_ANSWER": {
      const answer = action.answer.trim();
      if (!answer) return state;
      const messages: InterviewMessage[] = [
        ...state.messages,
        { role: "user", content: answer },
      ];
      const userTurns = countUserTurns(messages);
      if (userTurns >= INTERVIEW_MAX_TURNS) {
        return {
          ...state,
          messages,
          userTurns,
          pendingAnswer: "__FINISH__",
          phase: "processing",
          liveTranscript: "",
        };
      }
      return {
        ...state,
        messages,
        userTurns,
        pendingAnswer: answer,
        phase: "processing",
        liveTranscript: "",
      };
    }

    case "TURN_FAILED":
      return {
        ...state,
        phase: "listening",
        error: action.error,
        pendingAnswer: "",
      };

    case "DEBRIEF_READY":
      return {
        ...state,
        phase: "complete",
        debrief: action.content,
        messages: [
          ...state.messages,
          { role: "assistant", content: action.content },
        ],
        pendingAnswer: "",
      };

    case "REQUEST_FINISH":
      if (countUserTurns(state.messages) < 1) return state;
      return {
        ...state,
        phase: "processing",
        pendingAnswer: "__FINISH__",
        liveTranscript: "",
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}
