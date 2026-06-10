#!/usr/bin/env node
/**
 * Vérifie OPENROUTER_API_KEY dans .env et un appel minimal à l'API.
 * Usage: node scripts/check-openrouter.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvKey() {
  const envPath = resolve(process.cwd(), ".env");
  let raw = "";
  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    console.error("❌ Fichier .env introuvable à la racine du projet.");
    process.exit(1);
  }
  const line = raw
    .split("\n")
    .find((l) => l.startsWith("OPENROUTER_API_KEY="));
  if (!line) {
    console.error("❌ OPENROUTER_API_KEY absente de .env");
    process.exit(1);
  }
  return line.slice("OPENROUTER_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
}

const key = loadEnvKey();
if (!key || key.length < 32 || /your_openrouter|changeme/i.test(key)) {
  console.error("❌ Clé OpenRouter invalide ou placeholder dans .env");
  process.exit(1);
}

console.log("✓ Clé OpenRouter présente (" + key.slice(0, 12) + "…)");

const res = await fetch("https://openrouter.ai/api/v1/models", {
  headers: { Authorization: `Bearer ${key}` },
});

if (!res.ok) {
  console.error("❌ OpenRouter a refusé la clé:", res.status, await res.text());
  process.exit(1);
}

console.log("✓ Connexion OpenRouter OK — l'IA peut fonctionner après redémarrage de pnpm dev.");
