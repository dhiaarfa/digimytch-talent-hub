export const TECH_SYNONYMS: Record<string, string[]> = {
  js: ["javascript", "ecmascript"],
  ts: ["typescript"],
  node: ["nodejs", "node.js"],
  react: ["reactjs", "react.js"],
  next: ["nextjs", "next.js"],
  postgres: ["postgresql", "pg"],
  css: ["stylesheet", "styling"],
  api: ["rest", "restful", "endpoint"],
  ml: ["machine learning", "apprentissage automatique"],
  ia: ["intelligence artificielle", "ai", "artificial intelligence"],
};

const REVERSE: Record<string, string[]> = {};
for (const [key, values] of Object.entries(TECH_SYNONYMS)) {
  for (const v of [key, ...values]) {
    const k = v.toLowerCase();
    REVERSE[k] = Array.from(new Set([...(REVERSE[k] ?? []), key, ...values]));
  }
}

export function expandTechnicalSynonyms(token: string): string[] {
  const expanded = REVERSE[token.toLowerCase()];
  if (!expanded) return [token];
  return Array.from(new Set([token, ...expanded]));
}
