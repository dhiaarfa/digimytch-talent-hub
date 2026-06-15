@echo off
cd /d C:\Dev\digimytch-talent-hub

echo Deleting stray 0-byte files...
del /f /q "1.0" "1.1" "100ms" "12s" "14s" "3200" "900" "max-w-4xl" "max-w-5xl" "max-w-6xl" "mt-8" "py-10" "space-y-5"

echo.
echo Done. Remaining files in root:
dir /b *.
timeout /t 10 /nobreak
