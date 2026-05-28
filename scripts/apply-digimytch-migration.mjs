#!/usr/bin/env node
/**
 * Applique toutes les migrations SQL locales sur Postgres Docker (resumelm-db).
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(__dirname, "../supabase/migrations");

const migrationFiles = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

function runSql(sql, label) {
  const result = spawnSync(
    "docker",
    ["exec", "-i", "resumelm-db", "psql", "-U", "supabase_admin", "-d", "postgres"],
    { input: sql, encoding: "utf8", shell: process.platform === "win32" }
  );

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  if (result.error) {
    console.error(`❌ docker exec failed (${label}):`, result.error.message);
    process.exit(1);
  }

  const errors = (output.match(/^ERROR:.*$/gm) ?? []).filter(
    (line) =>
      !/already exists/i.test(line) && !/duplicate key/i.test(line)
  );

  if (errors.length > 0) {
    console.error(output);
    console.error(`❌ Migration échouée : ${label}`);
    process.exit(1);
  }

  if (/ERROR:/i.test(output)) {
    console.log(`ℹ️  ${label} — objets déjà présents (idempotent OK).`);
  } else {
    console.log(`✅ ${label}`);
  }

  if (result.status !== 0) {
    console.error(output);
    process.exit(1);
  }
}

for (const file of migrationFiles) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  runSql(sql, file);
}

const reload = spawnSync(
  "docker",
  [
    "exec",
    "resumelm-db",
    "psql",
    "-U",
    "supabase_admin",
    "-d",
    "postgres",
    "-c",
    "NOTIFY pgrst, 'reload schema';",
  ],
  { encoding: "utf8", shell: process.platform === "win32" }
);

if (reload.status !== 0) {
  console.warn(
    "⚠️ Rechargement du cache API (PostgREST) — redémarrez resumelm-rest si besoin."
  );
} else {
  console.log("✅ Cache API PostgREST rechargé.");
}

for (const container of ["resumelm-rest", "resumelm-storage"]) {
  const restart = spawnSync("docker", ["restart", container], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (restart.status === 0) {
    console.log(`✅ ${container} redémarré (cache schéma / Storage).`);
  } else {
    console.warn(`⚠️ Impossible de redémarrer ${container} — faites-le manuellement si besoin.`);
  }
}

console.log(`✅ ${migrationFiles.length} migration(s) appliquée(s).`);
