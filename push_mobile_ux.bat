@echo off
cd /d C:\Dev\digimytch-talent-hub

if exist ".git\index.lock" (
  del /f ".git\index.lock"
)

echo === Git status ===
git status --short

echo.
echo === Staging changes ===
git add src/components/dashboard/digimytch-shell.tsx
git add src/components/jobs/score-bridge-panel.tsx
git add src/components/landing/talent-hub/landing-nav.tsx
git add src/components/digimytch/candidatures-kanban.tsx
git add src/app/(dashboard)/candidatures/page.tsx
git add src/app/(dashboard)/home/page.tsx
git add src/components/interview/InterviewEngine.tsx
git add AUDIT_PLATFORME.md

echo.
echo === Staged files ===
git diff --cached --name-only

echo.
git commit -m "feat: mobile nav Plus drawer, inter-module CTAs, tablet/phone responsive fixes

Mobile nav:
- Bottom nav now shows 5 primary items (Accueil, CV, Offres, Candidatures, Entretiens)
- New Plus button opens a bottom sheet with secondary items (Score CV, LinkedIn, Formations)
- Sheet includes Profil, Parametres, Theme and Language toggles
- Nav items are equal-width flex-1 instead of fixed min-width scroll

Inter-module CTAs:
- ScoreBridgePanel footer: add Simuler un entretien pour ce poste button
- Links job title to interview simulator via query param

Mobile and tablet responsive fixes:
- Candidatures Kanban: snap-x scroll, 80vw column width on mobile, swipe hint
- Candidatures page: reduced px-2 on mobile for full-width kanban
- Interview Engine: 45svh chat area, tighter padding on small screens, debrief mx-2 on mobile
- Home page: reduced pb-24 to pb-20 (no more floating loyalty badge above nav)
- Landing nav: hamburger menu on mobile with dropdown for section links

Audit report:
- AUDIT_PLATFORME.md: full competitive audit vs Teal HQ, Huntr, Jobscan, Rezi, etc."

echo.
echo === Pushing to main ===
git push origin main

echo.
echo === Done ===
git log --oneline -4
timeout /t 30 /nobreak
