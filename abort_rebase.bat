@echo off
cd /d C:\Dev\digimytch-talent-hub

echo Aborting rebase...
git rebase --abort

echo.
echo === Remote commits not in local ===
git fetch origin
git log --oneline origin/main ^main

echo.
echo === Files changed on remote that conflict ===
git diff main..origin/main --name-only

echo.
echo === Done ===
timeout /t 60 /nobreak
