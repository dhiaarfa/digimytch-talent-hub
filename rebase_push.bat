@echo off
cd /d C:\Dev\digimytch-talent-hub

if exist ".git\index.lock" (
  echo Removing stale git index.lock...
  del /f ".git\index.lock"
)

echo Pulling with rebase from origin/main...
git pull --rebase origin main

echo.
echo Pushing to main...
git push origin main

echo.
echo === Done ===
timeout /t 30 /nobreak
