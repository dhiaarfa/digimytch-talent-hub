# Copie le projet vers C:\Dev\digimytch-talent-hub (sans node_modules ni caches lourds)
$src = "E:\DownloadFolder\resume-lm-main\resume-lm-main"
$dest = "C:\Dev\digimytch-talent-hub"

New-Item -ItemType Directory -Force -Path "C:\Dev" | Out-Null

Write-Host "Copie vers $dest ..."
robocopy $src $dest /E /XD node_modules .next out build coverage .git docker\supabase\volumes .vercel /XF *.log /NFL /NDL /NJH /NJS /nc /ns /np
if ($LASTEXITCODE -ge 8) { exit 1 }

Write-Host ""
Write-Host "OK. Ouvrez dans Cursor: $dest"
Write-Host "Puis: cd $dest && npx pnpm@9 install && npx pnpm@9 supabase:up"
