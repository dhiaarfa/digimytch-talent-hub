import type { InterviewMessage } from "@/lib/interview-simulator";

const MAX_CONTEXT_MESSAGES = 8;

export function trimInterviewMessages(messages: InterviewMessage[]): InterviewMessage[] {
  if (messages.length <= MAX_CONTEXT_MESSAGES) return messages;
  return messages.slice(-MAX_CONTEXT_MESSAGES);
}
