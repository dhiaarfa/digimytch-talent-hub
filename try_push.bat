@echo off
cd /d C:\Dev\digimytch-talent-hub

echo === Testing network to GitHub ===
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://github.com' -UseBasicParsing -TimeoutSec 10; Write-Host 'PowerShell HTTP: OK' $r.StatusCode } catch { Write-Host 'PowerShell HTTP: FAILED' $_.Exception.Message }"

echo === Trying with Schannel SSL backend ===
git config http.sslBackend schannel
git push origin main
if %ERRORLEVEL% EQU 0 goto :success

echo === Trying with default SSL ===
git config --unset http.sslBackend
git push origin main
if %ERRORLEVEL% EQU 0 goto :success

echo === Trying SSH over 443 ===
git remote set-url origin git@github.com:dhiaarfa/digimytch-talent-hub.git
git push origin main
git remote set-url origin https://github.com/dhiaarfa/digimytch-talent-hub.git

:success
echo === Final log ===
git log --oneline -3
timeout /t 60 /nobreak
