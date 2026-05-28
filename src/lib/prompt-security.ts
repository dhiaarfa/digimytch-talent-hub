const INJECTION_PATTERNS = [
  /\[[^\]]*\]/gim,
  /^\s*(ignore|system:|assistant:|human:).*$\n?/gim,
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
  // Approximation simple: 1 token ~ 0.75 mot pour FR/EN technique.
  return Math.ceil(input.trim().split(/\s+/).length * 1.33);
}

export function sanitizeForPrompt(input: string): PromptSanitizeResult {
  let output = input ?? "";
  let removedFragments = 0;

  for (const pattern of INJECTION_PATTERNS) {
    output = output.replace(pattern, (match) => {
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
