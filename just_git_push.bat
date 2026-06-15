@echo off
cd /d C:\Dev\digimytch-talent-hub
echo === Current log ===
git log --oneline -3
echo === Pushing to GitHub ===
git push origin main
echo === Done ===
git log --oneline -3
timeout /t 60 /nobreak
