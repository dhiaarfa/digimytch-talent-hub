@echo off
cd /d C:\Dev\digimytch-talent-hub

echo === Removing lock files ===
if exist ".git\index.lock" del /f /q ".git\index.lock"
if exist ".git\HEAD.lock" del /f /q ".git\HEAD.lock"
if exist ".git\COMMIT_EDITMSG.lock" del /f /q ".git\COMMIT_EDITMSG.lock"
if exist ".git\refs\heads\main.lock" del /f /q ".git\refs\heads\main.lock"

echo === Git status ===
git status --short

echo === Staging shell fix ===
git add src/components/dashboard/digimytch-shell.tsx

echo === Committing ===
git commit -m "fix: restore complete digimytch-shell.tsx with mobile nav"

echo === Pushing ===
git push origin main

echo.
echo === Result ===
git log --oneline -3

timeout /t 60 /nobreak
