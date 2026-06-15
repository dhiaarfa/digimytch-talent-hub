@echo off
cd /d C:\Dev\digimytch-talent-hub

if exist ".git\index.lock" (
  del /f ".git\index.lock"
)

:: Install @vercel/speed-insights
echo Installing speed-insights...
pnpm install --no-frozen-lockfile

:: Stage only the two relevant files
git add src/app/layout.tsx package.json pnpm-lock.yaml

git status --short

git commit -m "feat: add Vercel Speed Insights alongside Analytics

- Add @vercel/speed-insights ^1.2.0 to package.json
- Import SpeedInsights from @vercel/speed-insights/next
- Place <SpeedInsights /> next to <Analytics /> in root layout"

echo.
echo Pushing to main...
git push origin main

echo.
echo === Done ===
timeout /t 30 /nobreak
