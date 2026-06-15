@echo off
cd /d C:\Dev\digimytch-talent-hub

if exist ".git\index.lock" (
  del /f ".git\index.lock"
)

git add src/components/jobs/jobs-matching-hub.tsx
git commit -m "fix: remove unused Job/JobMatchResult imports (ESLint build error)"
git push origin main

echo.
git log --oneline -3
timeout /t 20 /nobreak
