#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { makeTestWav } from "./stt-test-wav.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(resolve(root, ".env"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const key = env.OPENROUTER_API_KEY;
if (!key) {
  console.error("❌ OPENROUTER_API_KEY manquante");
  process.exit(1);
}

const wav = makeTestWav(1);

const res = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "HTTP-Referer": env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
  },
  body: JSON.stringify({
    model: "openai/whisper-large-v3",
    language: "fr",
    input_audio: { data: wav.toString("base64"), format: "wav" },
  }),
});

const json = await res.json();
if (!res.ok) {
  console.error("❌ STT OpenRouter:", json.error?.message || JSON.stringify(json).slice(0, 200));
  process.exit(1);
}
console.log("✅ STT OpenRouter OK — texte:", JSON.stringify(json.text || "(vide)"));
