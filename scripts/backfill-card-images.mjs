#!/usr/bin/env node
/**
 * Remplit image_url pour formations et offres existantes (après migration).
 * Les cartes utilisent aussi un repli côté client si image_url est null.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Dupliqué minimal depuis card-images (évite import TS en .mjs)
const U = (id, w = 800, h = 450) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

const COURSE_TITLE_IMAGES = {
  "Parcours Full-Stack JavaScript": U("1498050108023-c5249f4df085"),
  "Fondamentaux PostgreSQL & SQL": U("1544383835-bda2bc66a55d"),
  "Docker & déploiement cloud": U("1667372393119-3d45c210fb22"),
};

function suggestCourse(title, skills) {
  if (COURSE_TITLE_IMAGES[title]) return COURSE_TITLE_IMAGES[title];
  const hay = `${title} ${(skills || []).join(" ")}`.toLowerCase();
  if (hay.includes("react") || hay.includes("javascript")) return U("1498050108023-c5249f4df085");
  if (hay.includes("sql")) return U("1544383835-bda2bc66a55d");
  if (hay.includes("docker") || hay.includes("devops")) return U("1667372393119-3d45c210fb22");
  return U("1501504905252-467f863fbef4");
}

function suggestJob(title, company, keywords) {
  const hay = `${title} ${company} ${(keywords || []).join(" ")}`.toLowerCase();
  if (hay.includes("react") || hay.includes("frontend")) return U("1461747286884-dccba6302f2e");
  if (hay.includes("devops") || hay.includes("docker")) return U("1451187580459-43490279c0fa");
  if (hay.includes("machine learning") || hay.includes("python")) return U("1677442136019-21780ecad995");
  return U("1497366216548-37526070297c");
}

const { data: courses, error: cErr } = await supabase.from("courses").select("id,title,skills_targeted,image_url");
if (cErr) {
  console.error("courses:", cErr.message);
  process.exit(1);
}

let courseUpdates = 0;
for (const c of courses ?? []) {
  if (c.image_url) continue;
  const url = suggestCourse(c.title, c.skills_targeted);
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
  if (j.image_url) continue;
  const url = suggestJob(j.position_title, j.company_name, j.keywords);
  const { error } = await supabase.from("jobs").update({ image_url: url }).eq("id", j.id);
  if (!error) jobUpdates++;
}

console.log(`✅ Backfill: ${courseUpdates} formations, ${jobUpdates} offres`);
