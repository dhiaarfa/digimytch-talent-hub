@echo off
cd /d C:\Dev\digimytch-talent-hub

if exist ".git\index.lock" (
  del /f ".git\index.lock"
)

echo Hard resetting to origin/main...
git reset --hard origin/main

echo.
echo === Current HEAD ===
git log --oneline -2

echo.
echo === Done ===
timeout /t 20 /nobreak
