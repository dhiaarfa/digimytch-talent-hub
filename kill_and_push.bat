@echo off
cd /d C:\Dev\digimytch-talent-hub

echo === Killing any running git processes ===
taskkill /F /IM git.exe 2>nul
taskkill /F /IM git-remote-https.exe 2>nul
ping -n 2 127.0.0.1 >nul

echo === Removing lock files ===
if exist ".git\index.lock" del /f /q ".git\index.lock" && echo deleted index.lock
if exist ".git\HEAD.lock" del /f /q ".git\HEAD.lock" && echo deleted HEAD.lock
if exist ".git\COMMIT_EDITMSG.lock" del /f /q ".git\COMMIT_EDITMSG.lock"
if exist ".git\objects\maintenance.lock" del /f /q ".git\objects\maintenance.lock"

echo === Lock file status ===
dir .git\*.lock 2>nul || echo No lock files found

echo === Staging ===
git add src/components/dashboard/digimytch-shell.tsx

echo === Committing ===
git commit -m "fix: restore complete digimytch-shell.tsx with mobile nav"

echo === Network check ===
ping -n 1 github.com >nul && echo github.com reachable || echo github.com NOT reachable

echo === Pushing ===
git push origin main

echo.
echo === Final log ===
git log --oneline -3

timeout /t 90 /nobreak
