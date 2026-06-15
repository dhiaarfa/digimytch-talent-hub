@echo off
cd /d C:\Dev\digimytch-talent-hub

if exist ".git\index.lock" (
  del /f ".git\index.lock"
)

echo === Git status ===
git status --short

echo.
echo === Staging changes ===
git add src/components/landing/talent-hub/hero-section.tsx
git add src/components/landing/talent-hub/sections.tsx
git add src/app/(dashboard)/entretiens/page.tsx
git add src/app/(dashboard)/linkedin/page.tsx
git add src/app/(dashboard)/score-cv/page.tsx
git add src/app/(dashboard)/formations/page.tsx
git add src/app/(dashboard)/jobs/page.tsx
git add src/app/(dashboard)/candidatures/page.tsx
git add src/lib/speech-tts.ts
git add src/components/interview/InterviewEngine.tsx
git add src/components/interview/interview-recognition-lifecycle.ts
git add src/lib/interview-simulator.ts

echo.
echo === Staged files ===
git diff --cached --name-only

echo.
git commit -m "fix: layout spacing, TTS voice quality, interview simulator improvements

Layout fixes:
- Landing hero: reduce pt-28/pb-20 -> pt-20/pb-12 (lg: pt-24/pb-16)
- Landing sections: all py-20 -> py-10 md:py-14 (HowItWorks, Features, Score, Testimonials, FAQ, CTA)
- Reduce section spacers: mt-14->mt-8, mt-12->mt-8, mt-10->mt-8
- Dashboard pages: widen max-width constraints
  - entretiens, linkedin: max-w-3xl -> max-w-4xl
  - score-cv: max-w-4xl -> max-w-5xl
  - formations, jobs: max-w-5xl -> max-w-6xl
  - All pages: py-8 -> py-6, space-y-6 -> space-y-5

Interview simulator (entretien AI) fixes:
- TTS rate: 1.5 -> 1.1 (natural cadence, not rushed)
- TTS pitch: 1.05 -> 1.0 (clean neutral voice)
- TTS char cap: 700 -> 900 (full questions always spoken)
- Chrome TTS keep-alive: 10s -> 14s (less disruptive pause/resume)
- Exclude Remi/Rémi from French female voice selection
- Safety timer: 8s -> 12s (longer questions finish speaking)
- Chat bubble height: 380px/45vh -> 440px/50vh (more context visible)
- SILENCE_SUBMIT_MS: 2800 -> 3200 (less aggressive auto-submit)
- RECOGNITION_RESTART_DELAY_MS: 80 -> 100ms
- Recruiter prompt: max 30 words/question, natural transitions, no hollow praise
- Debrief prompt: direct/honest feedback with concrete formulations"

echo.
echo === Pushing to main ===
git push origin main

echo.
echo === Done ===
git log --oneline -3
timeout /t 30 /nobreak
