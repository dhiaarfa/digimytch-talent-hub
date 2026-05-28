#!/usr/bin/env node
/**
 * Vérifie que l'API Supabase répond avant de lancer l'app.
 * Usage: node scripts/check-supabase.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // .env optionnel si variables déjà exportées
  }
}

loadEnvFile();

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ||
  "http://localhost:54321";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const timeoutMs = 8_000;

async function check() {
  if (!anonKey) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY manquant dans .env");
    process.exit(1);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      signal: controller.signal,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    if (!res.ok) {
      console.error(`❌ Supabase répond mais status ${res.status} (${url})`);
      process.exit(1);
    }
    console.log(`✅ Supabase OK — ${url}`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Supabase injoignable — ${url}`);
    console.error(
      "   → Ouvrez Docker Desktop, puis : npx pnpm@9 supabase:up\n" +
        "   → attendez 1–2 min et relancez : npx pnpm@9 supabase:check"
    );
    if (err instanceof Error && err.name !== "AbortError") {
      console.error(`   (${err.message})`);
    }
    process.exit(1);
  } finally {
    clearTimeout(timer);
  }
}

check();
