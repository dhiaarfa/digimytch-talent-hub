# ============================================================
# Digimytch Talent Hub — Lanceur local complet
# Double-cliquer pour tout démarrer en une fois.
# Prérequis : Docker Desktop doit être en cours d'exécution.
# ============================================================

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$dockerDir   = Join-Path $projectRoot "docker"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  Digimytch Talent Hub — Démarrage local" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Vérifier que Docker est disponible ---
Write-Host "[1/3] Vérification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Docker non disponible" }
    Write-Host "  ✓ $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "  ✗ Docker Desktop n'est pas démarré ou non installé." -ForegroundColor Red
    Write-Host "  → Lance Docker Desktop puis relance ce script." -ForegroundColor Red
    Write-Host ""
    Read-Host "Appuie sur Entrée pour fermer"
    exit 1
}

# --- 2. Démarrer les services Docker (DB + Redis + Supabase stack) ---
Write-Host ""
Write-Host "[2/3] Démarrage des services Docker (DB, Auth, Redis...)..." -ForegroundColor Yellow
Write-Host "  Répertoire : $dockerDir" -ForegroundColor DarkGray
Set-Location $dockerDir

$dockerRunning = docker compose ps --status running 2>&1 | Select-String "resumelm-db"
if ($dockerRunning) {
    Write-Host "  ✓ Services déjà actifs, skip." -ForegroundColor Green
} else {
    Write-Host "  Lancement de docker compose up -d ..." -ForegroundColor DarkGray
    docker compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  ✗ Échec docker compose up. Vérifie Docker Desktop." -ForegroundColor Red
        Read-Host "Appuie sur Entrée pour fermer"
        exit 1
    }
    Write-Host "  ✓ Services Docker démarrés." -ForegroundColor Green
    Write-Host "  ⏳ Attente 8s pour que la DB soit prête..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 8
}

# --- 3. Démarrer le serveur Next.js dans un nouveau terminal ---
Write-Host ""
Write-Host "[3/3] Démarrage du serveur Next.js (port 3001)..." -ForegroundColor Yellow
Set-Location $projectRoot

$psCommand = "Set-Location '$projectRoot'; Write-Host 'Démarrage pnpm dev...' -ForegroundColor Cyan; pnpm dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $psCommand

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Tout est lancé !" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  App Next.js     → http://localhost:3001" -ForegroundColor White
Write-Host "  Supabase API    → http://localhost:54321" -ForegroundColor White
Write-Host "  Supabase Studio → http://localhost:54323" -ForegroundColor White
Write-Host "  Redis           → localhost:6379" -ForegroundColor White
Write-Host "  Redis UI        → http://localhost:8081" -ForegroundColor White
Write-Host "  Inbucket (mail) → http://localhost:54324" -ForegroundColor White
Write-Host ""
Write-Host "  Login admin : admin@admin.com / Admin123" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Pour tout arrêter :" -ForegroundColor DarkGray
Write-Host "  cd docker && docker compose down" -ForegroundColor DarkGray
Write-Host ""
Read-Host "Appuie sur Entrée pour fermer cette fenêtre"
