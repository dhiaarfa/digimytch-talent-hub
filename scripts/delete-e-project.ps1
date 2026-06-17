# À lancer APRÈS avoir fermé Cursor sur l'ancien dossier E:
#   powershell -ExecutionPolicy Bypass -File C:\Dev\digimytch-talent-hub\scripts\delete-e-project.ps1

$target = "E:\DownloadFolder\resume-lm-main"
if (-not (Test-Path $target)) {
  Write-Host "Deja supprime: $target"
  exit 0
}

taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2
Remove-Item -LiteralPath $target -Recurse -Force
if (Test-Path $target) {
  Write-Host "Echec: fermez Cursor puis relancez ce script."
  exit 1
}
Write-Host "OK: $target supprime."
