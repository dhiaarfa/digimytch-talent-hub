#!/usr/bin/env node
/**
 * Vérifie que chaque modèle Digimytch répond (pas de 404).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = readFileSync(resolve(root, ".env"), "utf8");
const key = env.match(/OPENROUTER_API_KEY=(.+)/)?.[1]?.trim();
if (!key) {
  console.error("❌ OPENROUTER_API_KEY manquante");
  process.exit(1);
}

const MODELS = [
  "openrouter/free",
  "moonshotai/kimi-k2.6:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];

let failed = 0;
for (const model of MODELS) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Réponds uniquement: OK" }],
      max_tokens: 8,
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    const retryable = res.status === 429;
    console.error(
      `${retryable ? "⚠️" : "❌"} ${model} → ${res.status} ${body.slice(0, 120)}`
    );
    if (!retryable) failed++;
  } else {
    console.log(`✅ ${model}`);
  }
}

process.exit(failed > 0 ? 1 : 0);
