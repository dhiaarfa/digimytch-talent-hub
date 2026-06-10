#!/usr/bin/env node
/**
 * Backfill image_url for courses and jobs using src/lib/card-images.ts logic.
 *
 * Usage:
 *   node scripts/backfill-card-images.mjs          # only rows with null image_url
 *   node scripts/backfill-card-images.mjs --force  # refresh all catalogue rows
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { suggestCourseImageUrl, suggestJobImageUrl } from "../src/lib/card-images.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
if (!existsSync(envPath)) {
  console.error("Missing .env — cannot connect to Supabase.");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const force = process.argv.includes("--force");

const { data: courses, error: cErr } = await supabase
  .from("courses")
  .select("id,title,skills_targeted,image_url");
if (cErr) {
  console.error("courses:", cErr.message);
  process.exit(1);
}

let courseUpdates = 0;
for (const c of courses ?? []) {
  if (!force && c.image_url) continue;

  const url = suggestCourseImageUrl(c.title, c.skills_targeted ?? []);
  if (!force && c.image_url === url) continue;

  const { error } = await supabase.from("courses").update({ image_url: url }).eq("id", c.id);
  if (!error) courseUpdates++;
}

const { data: jobs, error: jErr } = await supabase
  .from("jobs")
  .select("id,position_title,company_name,keywords,image_url");
if (jErr) {
  console.error("jobs:", jErr.message);
  process.exit(1);
}

let jobUpdates = 0;
for (const j of jobs ?? []) {
  if (!force && j.image_url) continue;

  const url = suggestJobImageUrl(j.position_title, j.company_name, j.keywords ?? []);
  if (!force && j.image_url === url) continue;

  const { error } = await supabase.from("jobs").update({ image_url: url }).eq("id", j.id);
  if (!error) jobUpdates++;
}

console.log(`✅ Backfill (${force ? "force" : "null-only"}): ${courseUpdates} formations, ${jobUpdates} offres`);
