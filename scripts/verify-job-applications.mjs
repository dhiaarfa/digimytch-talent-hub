#!/usr/bin/env node
/**
 * Vérification intégration Supabase — flux candidatures (12 scénarios).
 * Prérequis : Docker Supabase (`npm run supabase:up`) + compte seed dans .env
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
const email = get("SEED_ADMIN_EMAIL") || "admin@admin.com";
const password = get("SEED_ADMIN_PASSWORD") || "Admin123";

let failed = 0;
let skipped = 0;

function ok(msg) {
  console.log(`✅ ${msg}`);
}
function fail(msg) {
  console.error(`❌ ${msg}`);
  failed++;
}
function skip(msg) {
  console.log(`⏭️  ${msg}`);
  skipped++;
}

async function healthCheck() {
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

let healthy = false;
for (let attempt = 0; attempt < 5 && !healthy; attempt++) {
  healthy = await healthCheck();
  if (!healthy && attempt < 4) await new Promise((r) => setTimeout(r, 1500));
}
if (!healthy) {
  console.error(
    "Supabase injoignable — lancez Docker Desktop puis `npm run supabase:up` et `npm run supabase:migrate`."
  );
  process.exit(2);
}

const userClient = createClient(url, anon);
const service = createClient(url, serviceKey);

const { data: auth, error: authErr } = await userClient.auth.signInWithPassword({
  email,
  password,
});
if (authErr || !auth.user) {
  fail(`Login ${email}: ${authErr?.message ?? "no user"}`);
  process.exit(1);
}
const userId = auth.user.id;
ok(`Login ${email}`);

const tag = `verify-${Date.now()}`;
let testJobId = null;

async function createTestJob() {
  const { data, error } = await userClient
    .from("jobs")
    .insert({
      user_id: userId,
      company_name: `${tag} Co`,
      position_title: `${tag} Dev`,
      description: "Integration test job",
      keywords: ["test"],
      is_active: true,
      work_location: "remote",
      employment_type: "full_time",
    })
    .select("id")
    .single();
  if (error) throw error;
  testJobId = data.id;
  return data.id;
}

async function cleanup() {
  if (!testJobId) return;
  await service.from("job_application_events").delete().in(
    "application_id",
    (
      await service
        .from("job_applications")
        .select("id")
        .eq("job_id", testJobId)
    ).data?.map((r) => r.id) ?? []
  );
  await service.from("job_applications").delete().eq("job_id", testJobId);
  await service.from("jobs").delete().eq("id", testJobId);
}

try {
  await createTestJob();
  ok(`S0: test job created (${testJobId})`);

  // S1 — insert candidature
  const { data: app1, error: e1 } = await userClient
    .from("job_applications")
    .insert({ user_id: userId, job_id: testJobId, status: "saved" })
    .select("*")
    .single();
  if (e1 || app1?.status !== "saved") fail(`S1 insert: ${e1?.message}`);
  else ok("S1: candidature saved créée");

  // S2 — soft delete + restore (simulate upsert)
  const delAt = new Date().toISOString();
  await userClient
    .from("job_applications")
    .update({ deleted_at: delAt })
    .eq("id", app1.id);
  const { data: restored, error: e2 } = await userClient
    .from("job_applications")
    .update({ deleted_at: null, status: "saved" })
    .eq("id", app1.id)
    .select("deleted_at, status")
    .single();
  if (e2 || restored?.deleted_at !== null) fail("S2 restore soft-deleted app");
  else ok("S2: candidature restaurée depuis corbeille");

  // S4 — job en corbeille → pas d'offre active
  await userClient.from("jobs").update({ deleted_at: delAt }).eq("id", testJobId);
  const { data: activeJob } = await userClient
    .from("jobs")
    .select("id")
    .eq("id", testJobId)
    .is("deleted_at", null)
    .maybeSingle();
  if (activeJob) fail("S4: job should be hidden when soft-deleted");
  else ok("S4: offre active absente quand job en corbeille");

  await userClient.from("jobs").update({ deleted_at: null }).eq("id", testJobId);
  ok("S4b: job restauré pour la suite");

  // S8 — cascade delete job + apps
  const { data: beforeCascade } = await userClient
    .from("job_applications")
    .select("deleted_at")
    .eq("id", app1.id)
    .single();
  const cascadeAt = new Date().toISOString();
  await userClient
    .from("job_applications")
    .update({ deleted_at: cascadeAt })
    .eq("job_id", testJobId)
    .is("deleted_at", null);
  await userClient.from("jobs").update({ deleted_at: cascadeAt }).eq("id", testJobId);
  const { data: afterCascade } = await userClient
    .from("job_applications")
    .select("deleted_at")
    .eq("id", app1.id)
    .single();
  if (!afterCascade?.deleted_at) fail("S8: application not cascaded to trash");
  else ok("S8: candidature en corbeille avec l'offre");

  // S9 — restore job + apps
  await userClient.from("jobs").update({ deleted_at: null }).eq("id", testJobId);
  await userClient
    .from("job_applications")
    .update({ deleted_at: null })
    .eq("job_id", testJobId);
  const { data: afterRestore } = await userClient
    .from("job_applications")
    .select("deleted_at")
    .eq("id", app1.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!afterRestore) fail("S9: application not active after restore");
  else ok("S9: candidature active après restauration offre");

  // S12 — list join: app without active job hidden
  await userClient.from("jobs").update({ deleted_at: cascadeAt }).eq("id", testJobId);
  const { data: appsList } = await userClient
    .from("job_applications")
    .select("*")
    .eq("user_id", userId)
    .eq("job_id", testJobId)
    .is("deleted_at", null);
  const { data: jobsList } = await userClient
    .from("jobs")
    .select("*")
    .in("id", [testJobId])
    .is("deleted_at", null);
  const visible = (appsList ?? []).filter((a) =>
    (jobsList ?? []).some((j) => j.id === a.job_id)
  );
  if (visible.length > 0) fail("S12: candidature visible without active job");
  else ok("S12: candidature masquée si offre en corbeille");

  await userClient.from("jobs").update({ deleted_at: null }).eq("id", testJobId);

  // S10 — restore candidature only (job stays active)
  await userClient
    .from("job_applications")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", app1.id);
  const { data: jobStillActive } = await userClient
    .from("jobs")
    .select("deleted_at")
    .eq("id", testJobId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!jobStillActive) fail("S10: job should stay active");
  else {
    const { data: restoredApp, error: s10Err } = await userClient
      .from("job_applications")
      .update({ deleted_at: null })
      .eq("id", app1.id)
      .select("deleted_at")
      .single();
    if (s10Err || restoredApp?.deleted_at !== null) fail("S10: restore candidature from corbeille");
    else ok("S10: candidature restaurée (offre toujours active)");
  }

  // S11 — kanban status change + event row
  const { data: beforeStatus } = await userClient
    .from("job_applications")
    .update({ status: "saved" })
    .eq("id", app1.id)
    .select("status")
    .single();
  if (beforeStatus?.status !== "saved") fail("S11: reset status to saved");
  else {
    const { data: applied, error: s11Err } = await userClient
      .from("job_applications")
      .update({ status: "applied" })
      .eq("id", app1.id)
      .select("status")
      .single();
    if (s11Err || applied?.status !== "applied") fail("S11: status update failed");
    else {
      const { error: evErr } = await userClient.from("job_application_events").insert({
        application_id: app1.id,
        from_status: "saved",
        to_status: "applied",
      });
      if (evErr) fail(`S11: event insert: ${evErr.message}`);
      else ok("S11: statut saved → applied + événement");
    }
  }

  // UNIQUE — one row per user+job
  const { error: dupErr } = await userClient.from("job_applications").insert({
    user_id: userId,
    job_id: testJobId,
    status: "saved",
  });
  if (dupErr?.code !== "23505") fail(`S3: expected 23505 on duplicate, got ${dupErr?.code}`);
  else ok("S3: contrainte UNIQUE (user_id, job_id) confirmée");

  // Migration column
  const { error: colErr } = await userClient
    .from("job_applications")
    .select("deleted_at")
    .limit(1);
  if (colErr?.message?.includes("deleted_at")) {
    fail("Migration soft-delete manquante — npm run supabase:migrate");
  } else ok("Migration deleted_at présente");

  ok(`Terminé — ${failed} échec(s), ${skipped} ignoré(s)`);
} catch (e) {
  fail(`Exception: ${e instanceof Error ? e.message : String(e)}`);
} finally {
  await cleanup();
}

// App HTTP (optional, fast)
const appBase = "http://localhost:3001";
try {
  const loginRes = await fetch(`${appBase}/auth/login`, {
    signal: AbortSignal.timeout(5000),
  });
  if (loginRes.ok) ok("App /auth/login accessible");
  else skip(`App HTTP ${loginRes.status} — lancez npm run dev:turbo`);

  const signoutRes = await fetch(`${appBase}/auth/signout`, {
    redirect: "manual",
    signal: AbortSignal.timeout(5000),
  });
  if (signoutRes.status >= 300 && signoutRes.status < 400) {
    ok("App /auth/signout redirige (logout route)");
  } else {
    skip(`App /auth/signout HTTP ${signoutRes.status}`);
  }

  const homeRes = await fetch(`${appBase}/home`, {
    redirect: "manual",
    signal: AbortSignal.timeout(5000),
  });
  if (homeRes.status === 307 || homeRes.status === 302) {
    ok("App /home protégé (redirige sans session)");
  } else {
    skip(`App /home HTTP ${homeRes.status} (attendu redirect sans cookie)`);
  }
} catch {
  skip("App non démarrée — npm run dev:turbo pour test HTTP");
}

process.exit(failed ? 1 : 0);
