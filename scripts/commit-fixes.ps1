# Commit all audit fixes (tasks #32-#43)
# Run from: C:\Dev\digimytch-talent-hub
# Usage: powershell -ExecutionPolicy Bypass -File scripts\commit-fixes.ps1

Set-Location "C:\Dev\digimytch-talent-hub"

# Stage only the files changed by the audit fixes
git add package.json `
  "src/app/(dashboard)/formations/page.tsx" `
  "src/app/(dashboard)/settings/page.tsx" `
  "src/app/(dashboard)/start-trial/page.tsx" `
  "src/app/api/speech/transcribe/route.ts" `
  "src/components/digimytch/interview-simulator-panel.tsx" `
  "src/utils/actions/digimytch/actions.ts" `
  "src/utils/actions/digimytch/interview-simulator.ts" `
  "src/utils/actions/index.ts" `
  "supabase/migrations/20260605120000_pgvector_semantic_matching.sql"

git commit -m "fix: apply all critical audit fixes (tasks #32-#43)

- Translate /start-trial page fully to French
- Uncomment all exports in utils/actions/index.ts
- Fix settings page: replace revalidate=3600 with force-dynamic
- Fix pgvector migration: storage.vector -> vector (correct namespace)
- Add rate limit to /api/speech/transcribe route
- Fix showMicInstructions localStorage SSR hydration mismatch (useEffect)
- Fix formations page double query (single getFormationHubData call)
- Fix interview debrief: use generateObject + Zod schema for structured output
- Sanitize user messages in continueInterviewSimulation (prompt injection)
- Increase interview maxTokens: 220 -> 320 for questions, 900 for debrief
- Setup test runner: node --test with tsx (31 test files now runnable)"

git push origin main
Write-Host "`nDone! Check Vercel for deployment status." -ForegroundColor Green
