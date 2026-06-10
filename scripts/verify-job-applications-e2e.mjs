#!/usr/bin/env node
/**
 * Scénarios E2E candidat — upsert réel + catalogue (complète verify-job-applications.mjs).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envRaw = readFileSync(resolve(root, ".env"), "utf8");
const get = (k) => envRaw.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim() ?? "";

const url = (get("NEXT_PUBLIC_SUPABASE_URL") || "http://127.0.0.1:54321").replace(/\/$/, "");
const anon = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceKey = get("SUPABASE_SERVICE_ROLE_KEY");
const E2E_EMAIL = "candidat-e2e@local.test";
const E2E_PASSWORD = "Test123456";

const CATALOG = {
  slug: "vermeg-fullstack",
  company_name: "Vermeg",
  position_title: "Développeur Full Stack Java / React",
};

let failed = 0;
function ok(msg) {
  console.log(`✅ ${msg}`);
}
function fail(msg) {
  console.error(`❌ ${msg}`);
  failed++;
}

/** Mirrors upsertJobApplication core (restore soft-deleted row). */
async function upsertApplication(client, userId, jobId) {
  const { data: jobRow } = await client
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!jobRow) throw new Error("Offre introuvable");

  const { data: existing } = await client
    .from("job_applications")
    .select("*")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await client
      .from("job_applications")
      .update({ deleted_at: null, status: "saved" })
      .eq("id", existing.id)
      .select()
      .single();
    if (error || !updated) throw error ?? new Error("update failed");
    return updated;
  }

  const { data: created, error } = await client
    .from("job_applications")
    .insert({ user_id: userId, job_id: jobId, status: "saved" })
    .select()
    .single();
  if (error?.code === "23505") {
    const { data: raced } = await client
      .from("job_applications")
      .select("*")
      .eq("user_id", userId)
      .eq("job_id", jobId)
      .maybeSingle();
    if (raced) {
      const { data: updated } = await client
        .from("job_applications")
        .update({ deleted_at: null, status: "saved" })
        .eq("id", raced.id)
        .select()
        .single();
      return updated;
    }
  }
  if (error || !created) throw error ?? new Error("insert failed");
  return created;
}

const client = createClient(url, anon);
const service = createClient(url, serviceKey);

const { data: auth, error: authErr } = await client.auth.signInWithPassword({
  email: E2E_EMAIL,
  password: E2E_PASSWORD,
});
if (authErr || !auth.user) {
  console.error(`Login E2E impossible: ${authErr?.message ?? "no user"}`);
  process.exit(2);
}
const userId = auth.user.id;
ok(`Login ${E2E_EMAIL}`);

const tag = `e2e-${Date.now()}`;
let catalogJobId = null;

try {
  // S5 — catalogue : nouvelle offre + candidature
  const { data: catJob, error: catErr } = await client
    .from("jobs")
    .insert({
      user_id: userId,
      company_name: CATALOG.company_name,
      position_title: `${CATALOG.position_title} ${tag}`,
      description: "Catalog E2E test",
      keywords: ["java", "react"],
      is_active: true,
      work_location: "in_person",
      employment_type: "full_time",
    })
    .select("id")
    .single();
  if (catErr) fail(`S5 job insert: ${catErr.message}`);
  else {
    catalogJobId = catJob.id;
    const app = await upsertApplication(client, userId, catalogJobId);
    if (app?.status === "saved" && !app.deleted_at) ok("S5: catalogue → job + candidature saved");
    else fail("S5: candidature invalide après catalogue");
  }

  // S2 bugfix — soft delete puis ré-ajout (doit restaurer, pas 23505)
  const { data: appsBefore } = await client
    .from("job_applications")
    .select("id")
    .eq("user_id", userId)
    .eq("job_id", catalogJobId)
    .maybeSingle();
  if (!appsBefore) fail("S2: app missing before trash");
  else {
    await client
      .from("job_applications")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", appsBefore.id);
    const { count: visibleBefore } = await client
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("job_id", catalogJobId)
      .is("deleted_at", null);
    if (visibleBefore !== 0) fail("S2: app still visible in active list");
    else ok("S2: candidature en corbeille (masquée)");

    const restored = await upsertApplication(client, userId, catalogJobId);
    if (restored?.deleted_at === null) ok("S2: ré-ajout restaure la candidature (fix UNIQUE)");
    else fail("S2: ré-ajout n'a pas restauré deleted_at");
  }

  // S6 — offre existante sans candidature → upsert seulement
  const { data: orphanJob } = await client
    .from("jobs")
    .insert({
      user_id: userId,
      company_name: `${tag} Orphan Co`,
      position_title: `${tag} Orphan Dev`,
      description: "No app yet",
      keywords: [],
      is_active: true,
      work_location: "remote",
      employment_type: "full_time",
    })
    .select("id")
    .single();
  if (orphanJob) {
    await service.from("job_applications").delete().eq("job_id", orphanJob.id);
    const app = await upsertApplication(client, userId, orphanJob.id);
    if (app?.status === "saved") ok("S6: upsert sur offre sans candidature existante");
    else fail("S6: upsert orphan job failed");
    await service.from("job_applications").delete().eq("job_id", orphanJob.id);
    await service.from("jobs").delete().eq("id", orphanJob.id);
  }

  // S7 — job catalogue soft-deleted → restore + upsert
  if (catalogJobId) {
    const delAt = new Date().toISOString();
    await client.from("jobs").update({ deleted_at: delAt }).eq("id", catalogJobId);
    await client
      .from("jobs")
      .update({ deleted_at: null })
      .eq("id", catalogJobId);
    const app = await upsertApplication(client, userId, catalogJobId);
    if (app?.deleted_at === null) ok("S7: job restauré + candidature active");
    else fail("S7: restore job + upsert failed");
  }

  ok(`E2E candidat terminé — ${failed} échec(s)`);
} catch (e) {
  fail(`Exception: ${e instanceof Error ? e.message : String(e)}`);
} finally {
  if (catalogJobId) {
    await service.from("job_application_events").delete().in(
      "application_id",
      (await service.from("job_applications").select("id").eq("job_id", catalogJobId)).data?.map(
        (r) => r.id
      ) ?? []
    );
    await service.from("job_applications").delete().eq("job_id", catalogJobId);
    await service.from("jobs").delete().eq("id", catalogJobId);
  }
}

process.exit(failed ? 1 : 0);
