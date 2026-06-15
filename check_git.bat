@echo off
cd /d C:\Dev\digimytch-talent-hub
echo === Local commits (top 3) ===
git log --oneline -3
echo.
echo === Remote origin/main (top 3) ===
git log --oneline origin/main -3
echo.
echo === Git status ===
git status --short
echo.
echo === Done ===
timeout /t 30 /nobreak
