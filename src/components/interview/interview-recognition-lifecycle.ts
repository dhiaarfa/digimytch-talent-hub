/** Delay before opening the mic after TTS ends. Zero is fine — browser TTS stops before STT starts. */
export const LISTENING_START_DELAY_MS = 0;

/** Delay before restarting a single-shot recognition session after `onend`. */
export const RECOGNITION_RESTART_DELAY_MS = 100;

/** Auto-submit after this much silence once the user has spoken.
 *  3200ms gives enough room for natural pauses mid-sentence without cutting off.
 */
export const SILENCE_SUBMIT_MS = 3200;

export const MIN_TRANSCRIPT_CHARS = 2;

export type RecognitionEndAction =
  | { type: "idle" }
  | { type: "restart" }
  | { type: "schedule_silence_submit" }
  | { type: "schedule_silence_submit_and_restart" };

/**
 * Decide what to do when a single-shot Web Speech session ends while the
 * interview engine is still in the listening phase.
 */
export function getRecognitionEndAction(
  sessionActive: boolean,
  pendingText: string,
  minChars: number = MIN_TRANSCRIPT_CHARS
): RecognitionEndAction {
  if (!sessionActive) {
    return { type: "idle" };
  }

  const trimmed = pendingText.trim();
  if (trimmed.length >= minChars) {
    return { type: "schedule_silence_submit_and_restart" };
  }

  return { type: "restart" };
}

/** Whether a recognition error should trigger an automatic retry. */
export function shouldRetryRecognitionAfterError(
  error: string,
  sessionActive: boolean
): boolean {
  if (!sessionActive) return false;
  return error === "no-speech";
}
