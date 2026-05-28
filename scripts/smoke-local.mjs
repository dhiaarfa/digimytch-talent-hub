#!/usr/bin/env node
/**
 * Smoke test local: Supabase auth + API de base (sans clé IA).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = readFileSync(resolve(root, ".env"), "utf8");
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim() ?? "";

const url = get("NEXT_PUBLIC_SUPABASE_URL") || "http://localhost:54321";
const anon = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const email = get("SEED_ADMIN_EMAIL") || "admin@admin.com";
const password = get("SEED_ADMIN_PASSWORD") || "Admin123";

const supabase = createClient(url, anon);

let failed = 0;
function ok(msg) {
  console.log(`✅ ${msg}`);
}
function fail(msg) {
  console.error(`❌ ${msg}`);
  failed++;
}

const health = await fetch(`${url}/auth/v1/health`, {
  headers: { apikey: anon, Authorization: `Bearer ${anon}` },
});
if (!health.ok) fail(`Supabase health ${health.status}`);
else ok("Supabase health");

const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
  email,
  password,
});
if (authErr) fail(`Login ${email}: ${authErr.message}`);
else ok(`Login ${email}`);

const { data: courses, error: cErr } = await supabase.from("courses").select("id,title").limit(3);
if (cErr) fail(`Courses: ${cErr.message}`);
else ok(`Catalogue formations (${courses?.length ?? 0} lignes)`);

const { data: jobs } = await supabase.from("jobs").select("id").limit(1);
ok(`Table jobs accessible (${jobs?.length ?? 0} ligne(s))`);

const appRes = await fetch("http://localhost:3001/");
if (!appRes.ok) fail(`App HTTP ${appRes.status}`);
else ok("App http://localhost:3001");

const html = await appRes.text();
if (!/Digimytch/i.test(html)) fail("Landing sans marque Digimytch");
else ok("Landing Digimytch");

process.exit(failed ? 1 : 0);
