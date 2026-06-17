#!/usr/bin/env pwsh
# deploy.ps1 — clean commit + push to GitHub → triggers Vercel deploy
# Run from: C:\Dev\digimytch-talent-hub
# Usage:    powershell -ExecutionPolicy Bypass -File scripts\deploy.ps1

Set-Location $PSScriptRoot\..
$ErrorActionPreference = "Stop"

Write-Host "`n=== Digimytch Talent Hub — Deploy Script ===" -ForegroundColor Cyan

# ── 1. Remove git lock if any ───────────────────────────────────────────────
if (Test-Path ".git\index.lock") {
    Remove-Item ".git\index.lock" -Force
    Write-Host "✓ Removed .git/index.lock" -ForegroundColor Green
}

# ── 2. Delete phantom file ──────────────────────────────────────────────────
$phantom = "src\app\api\openrouter\capabilities\sedlmcVgd"
if (Test-Path $phantom) {
    Remove-Item $phantom -Force
    Write-Host "✓ Deleted phantom file sedlmcVgd" -ForegroundColor Green
}

# ── 3. Reset staging area (keep all working-tree changes) ───────────────────
git reset HEAD --quiet
Write-Host "✓ Staging area reset" -ForegroundColor Green

# ── 4. Stage the right files ────────────────────────────────────────────────
# Core source code (all our fixes)
git add src/

# Config + infra
git add .gitignore
git add supabase/migrations/
git add docker/docker-compose.yml

# Docs (new ARCHITECTURE.md is untracked — add it)
if (Test-Path "ARCHITECTURE.md") { git add ARCHITECTURE.md }

# Keep .cursorignore (helps IDE, harmless in repo)
if (Test-Path ".cursorignore") { git add .cursorignore }

# ── 5. Explicitly un-stage files that must NOT be committed ─────────────────
# (gitignore now covers these, but belt-and-suspenders for anything already staged)
$excludes = @(
    "AUDIT_PLATFORME.md",
    "CONTEXTE-PFE.md",
    "tests.md",
    "start-dev.ps1",
    "scripts/copy-to-c-drive.ps1",
    "scripts/delete-e-project.ps1",
    "scripts/commit-fixes.ps1",
    "src/app/api/openrouter/capabilities/sedlmcVgd"
)
foreach ($f in $excludes) {
    git restore --staged $f 2>$null
}

Write-Host "✓ Staged correct files" -ForegroundColor Green

# ── 6. Show what we're about to commit ──────────────────────────────────────
Write-Host "`n--- Files to commit ---" -ForegroundColor Yellow
git diff --cached --name-status
Write-Host "--- End of list ---`n" -ForegroundColor Yellow

# ── 7. TypeScript check ─────────────────────────────────────────────────────
Write-Host "Running tsc --noEmit ..." -ForegroundColor Cyan
$tsc = node_modules\.bin\tsc --noEmit 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "TypeScript errors found:" -ForegroundColor Red
    Write-Host $tsc
    Write-Host "`nAbort: fix TS errors before deploying." -ForegroundColor Red
    exit 1
}
Write-Host "✓ TypeScript OK" -ForegroundColor Green

# ── 8. Commit ───────────────────────────────────────────────────────────────
$msg = @"
deploy: full security + bug fix pass — Digimytch Talent Hub

Security fixes (adversarial audit):
- /api/ocr-cv: add auth guard (was open to anonymous callers)
- /api/linkedin-analyze: add auth guard (same issue)
- /api/resume-score: add rate limiting + IDOR ownership check
- /api/openrouter/capabilities: add auth (was excluded from middleware)
- middleware: return JSON 401 for /api/* instead of 307 HTML redirect
- getInterviewScenarioForJob: fix IDOR — add user_id filter on jobs query

Bug fixes:
- index.ts: uncomment all action exports
- speech/transcribe: rate limit already present (confirmed)
- showMicInstructions: SSR-safe (confirmed)
- formations: no double query via getCachedJobsWithMatch (confirmed)
- debrief: generateObject + Zod schema already used (confirmed)
- interview messages: sanitizeForPrompt() applied (confirmed)
- interview maxTokens: 100/120 → 320 questions, 650 → 900 debrief
- login form: Se souvenir de moi already present (confirmed)

UI / layout:
- globals.css: font-size 116% for presentation readability
- digimytch-shell: sidebar 260px, nav items taller (py-3 min-h-3rem)
- layout.tsx: remove @vercel/speed-insights (not installed)

Infra:
- docker-compose.yml: rename containers resumelm → digimytch
- .gitignore: exclude slide-*.jpg, *.pptx, local audit docs, phantom file
- ARCHITECTURE.md: add full technical reference doc
"@

git commit -m $msg
Write-Host "✓ Committed" -ForegroundColor Green

# ── 9. Push to GitHub (triggers Vercel auto-deploy) ─────────────────────────
Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
git push origin main
Write-Host "`n✅ Done! Vercel will deploy automatically in ~2 minutes." -ForegroundColor Green
Write-Host "   Monitor at: https://vercel.com/dashboard" -ForegroundColor Cyan
