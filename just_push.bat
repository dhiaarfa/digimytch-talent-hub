@echo off
cd /d C:\Dev\digimytch-talent-hub
echo === Current status ===
git log --oneline -3
echo.
echo === Pushing to GitHub ===
git push origin main
echo.
echo === Done ===
git log --oneline -3
timeout /t 30 /nobreak
