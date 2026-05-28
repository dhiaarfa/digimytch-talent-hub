#!/usr/bin/env node
/**
 * Maintenance automatique avant dev/build :
 * - Nettoie .next / .turbo / out si trop volumineux (libère de l'espace disque).
 * - Vérifie Docker Supabase si la commande parente est "dev" (optionnel, non bloquant).
 */
import { rmSync, existsSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

/** Seuils Mo — au-delà, suppression automatique */
const THRESHOLDS_MB = {
  ".next": 400,
  ".turbo": 150,
  out: 100,
};

function dirSizeMb(dirPath) {
  if (!existsSync(dirPath)) return 0;
  try {
    const st = statSync(dirPath);
    if (!st.isDirectory()) return 0;
  } catch {
    return 0;
  }

  if (process.platform === "win32") {
    const r = spawnSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `(Get-ChildItem -LiteralPath '${dirPath.replace(/'/g, "''")}' -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB`,
      ],
      { encoding: "utf8", shell: true }
    );
    const n = parseFloat(String(r.stdout).trim());
    return Number.isFinite(n) ? n : 0;
  }

  const r = spawnSync("du", ["-sm", dirPath], { encoding: "utf8" });
  const n = parseFloat(String(r.stdout).split("\t")[0]);
  return Number.isFinite(n) ? n : 0;
}

function removeDir(name) {
  const p = resolve(root, name);
  if (!existsSync(p)) return false;
  try {
    rmSync(p, { recursive: true, force: true });
    console.log(`🧹 Auto-nettoyage : ${name}/ supprimé (libération d'espace)`);
    return true;
  } catch (e) {
    console.warn(`⚠️ Impossible de supprimer ${name}/ :`, e.message);
    return false;
  }
}

let freed = false;
for (const [dir, limitMb] of Object.entries(THRESHOLDS_MB)) {
  const full = resolve(root, dir);
  const size = dirSizeMb(full);
  if (size > limitMb) {
    console.log(`📦 ${dir}/ ≈ ${Math.round(size)} Mo (seuil ${limitMb} Mo)`);
    if (removeDir(dir)) freed = true;
  }
}

if (!freed) {
  console.log("✅ Cache build OK — pas de nettoyage nécessaire");
}
