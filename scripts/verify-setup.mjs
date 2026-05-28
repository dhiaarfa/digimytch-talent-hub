#!/usr/bin/env node
/**
 * Vérifie .env + Supabase + OpenRouter (sans afficher les secrets).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { makeTestWav } from "./stt-test-wav.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync(resolve(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
    }
  } catch {
    console.error("❌ Fichier .env introuvable — copiez .env.example vers .env");
    process.exit(1);
  }
  return env;
}

const env = loadEnv();
let ok = true;

function check(name, cond, hint) {
  if (cond) {
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name}`);
    if (hint) console.log(`   → ${hint}`);
    ok = false;
  }
}

check("NEXT_PUBLIC_SUPABASE_URL", Boolean(env.NEXT_PUBLIC_SUPABASE_URL), "http://localhost:54321");
check(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").startsWith("eyJ"),
  "Clé anon du stack Docker local"
);
check(
  "SUPABASE_SERVICE_ROLE_KEY",
  (env.SUPABASE_SERVICE_ROLE_KEY || "").startsWith("eyJ"),
  "Clé service_role Docker"
);
check(
  "OPENROUTER_API_KEY",
  (env.OPENROUTER_API_KEY || "").startsWith("sk-or-"),
  "https://openrouter.ai/keys"
);
check("NEXT_PUBLIC_SITE_URL", Boolean(env.NEXT_PUBLIC_SITE_URL), "http://localhost:3001");
check(
  "AUTO_PRO_SUBSCRIPTION",
  env.AUTO_PRO_SUBSCRIPTION === "true",
  "AUTO_PRO_SUBSCRIPTION=true pour la démo"
);
check("SEED_ADMIN_EMAIL", Boolean(env.SEED_ADMIN_EMAIL), "admin@admin.com");

const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
try {
  const health = await fetch(`${url}/auth/v1/health`, {
    headers: {
      apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    signal: AbortSignal.timeout(8000),
  });
  check("Supabase reachable", health.ok, "npm run supabase:up");
} catch {
  check("Supabase reachable", false, "Docker Desktop + npm run supabase:up");
}

if (env.OPENROUTER_API_KEY?.startsWith("sk-or-")) {
  try {
    const or = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    if (or.ok) {
      const data = await or.json();
      const limit = data.data?.limit ?? data.limit;
      const usage = data.data?.usage ?? data.usage;
      console.log(`✅ OpenRouter clé valide (usage: ${usage ?? "?"}, limite: ${limit ?? "?"})`);

      try {
        const wav = makeTestWav(1);
        const stt = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
          },
          body: JSON.stringify({
            model: "openai/whisper-large-v3",
            language: "fr",
            input_audio: { data: wav.toString("base64"), format: "wav" },
          }),
          signal: AbortSignal.timeout(15000),
        });
        const sttJson = await stt.json();
        if (stt.ok) {
          console.log("✅ Transcription audio OpenRouter disponible");
        } else if (
          String(sttJson.error?.message || "").includes("$0.50") ||
          String(sttJson.error?.message || "").includes("balance")
        ) {
          console.log(
            "⚠️ Micro OpenRouter : créditez ≥ 0,50 $ sur https://openrouter.ai/credits (sinon utilisez Chrome/Edge — micro navigateur)"
          );
        } else {
          console.log(`⚠️ STT OpenRouter : ${sttJson.error?.message || stt.status}`);
        }
      } catch {
        console.log("⚠️ Test STT OpenRouter ignoré (réseau)");
      }
    } else {
      check("OpenRouter clé valide", false, "Clé invalide ou expirée sur openrouter.ai");
      ok = false;
    }
  } catch {
    check("OpenRouter reachable", false, "Vérifiez votre connexion internet");
    ok = false;
  }
}

console.log(ok ? "\n✅ Configuration prête pour npm run dev" : "\n⚠️ Corrigez les points ci-dessus");
process.exit(ok ? 0 : 1);
