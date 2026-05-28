#!/usr/bin/env node
/** Supprime les artefacts de build (réduit la taille du dossier projet). */
import { rmSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const dir of [".next", "out", ".turbo"]) {
  const p = resolve(root, dir);
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    console.log(`Removed ${dir}/`);
  }
}
console.log("Done.");
