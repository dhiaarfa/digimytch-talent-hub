@echo off
cd /d C:\Dev\digimytch-talent-hub
echo === Git Status ===
git status
echo.
echo === Staging all changes ===
git add -A
echo.
echo === Committing ===
git commit -m "fix: CI pnpm version - remove hardcoded version, use packageManager field"
echo.
echo === Pushing ===
git push origin HEAD:main
echo.
echo === Done - exit code: %errorlevel% ===
echo Check GitHub / Vercel now.
timeout /t 60 /nobreak
