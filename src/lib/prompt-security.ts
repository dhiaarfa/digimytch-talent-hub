/**
 * Prompt injection sanitizer.
 *
 * Patterns target known LLM control tokens and role-override keywords only.
 * We deliberately do NOT strip generic brackets like [JavaScript] or [2023-2025]
 * because those are legitimate content found in CVs and job descriptions.
 */

const INJECTION_PATTERNS = [
  // Known LLM control tokens: [INST], [/INST], [SYS], [SYSTEM: payload], etc.
  /\[\/?(?:INST|SYS|SYSTEM|END|HUMAN|ASSISTANT|USER|BOT|GPT|AI|PROMPT|CONTEXT|STOP)(?::[^\]]*)?\]/gim,
  // Role override at line start: "ignore previous instructions", "system:", "assistant:", etc.
  /^\s*(ignore\s+(?:all\s+)?(?:previous|above|prior|instructions?)|system\s*:|assistant\s*:|human\s*:|user\s*:)\s*\S.*$/gim,
  // Jailbreak openers at line start
  /^\s*(?:DAN|JAILBREAK|DEVELOPER\s+MODE|OVERRIDE|BYPASS)\b/gim,
];

const MAX_PROMPT_TOKENS = 4000;

export type PromptSanitizeResult = {
  text: string;
  detected: boolean;
  removedFragments: number;
  originalTokenEstimate: number;
  finalTokenEstimate: number;
  wasTrimmed: boolean;
};

function estimateTokenCount(input: string): number {
  if (!input.trim()) return 0;
  return Math.ceil(input.trim().split(/\s+/).length * 1.33);
}

export function sanitizeForPrompt(input: string): PromptSanitizeResult {
  let output = input ?? "";
  let removedFragments = 0;

  for (const pattern of INJECTION_PATTERNS) {
    output = output.replace(pattern, () => {
      removedFragments += 1;
      return "";
    });
  }

  output = output.replace(/\n{3,}/g, "\n\n").trim();

  const originalTokenEstimate = estimateTokenCount(input);
  const detected = removedFragments > 0;
  const words = output.split(/\s+/).filter(Boolean);
  const maxWords = Math.floor(MAX_PROMPT_TOKENS / 1.33);
  const wasTrimmed = words.length > maxWords;
  const trimmedText = wasTrimmed ? words.slice(0, maxWords).join(" ") : output;

  return {
    text: trimmedText,
    detected,
    removedFragments,
    originalTokenEstimate,
    finalTokenEstimate: estimateTokenCount(trimmedText),
    wasTrimmed,
  };
}

export function sanitizeUnknownForPrompt(value: unknown): PromptSanitizeResult {
  const raw =
    typeof value === "string"
      ? value
      : JSON.stringify(value, null, 0) ?? "";
  return sanitizeForPrompt(raw);
}
