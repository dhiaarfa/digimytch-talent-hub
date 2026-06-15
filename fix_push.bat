@echo off
cd /d C:\Dev\digimytch-talent-hub

if exist ".git\index.lock" del /f ".git\index.lock"
if exist ".git\HEAD.lock" del /f ".git\HEAD.lock"
if exist ".git\COMMIT_EDITMSG.lock" del /f ".git\COMMIT_EDITMSG.lock"

echo === Staging fix ===
git add src/components/dashboard/digimytch-shell.tsx

echo === Committing ===
git commit -m "fix: complete digimytch-shell.tsx — restore truncated content, remove duplicate tail"

echo === Pushing ===
git push origin main

echo === Done ===
git log --oneline -3
timeout /t 30 /nobreak
