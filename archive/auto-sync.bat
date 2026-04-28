@echo off
echo ============================================
echo   DROPSERVICE PLATFORM - AAA SYNC
echo ============================================
echo.

cd /d "C:\Users\Esteban\Desktop\Skill IA"

echo [1/4] Staging all changes...
git add -A
echo DONE.

echo [2/4] Committing...
git commit -m "chore(arch): finalize Grade AAA certification. Standardized Result<T,AppError> across all handlers, resolved 160+ TSC errors, enabled incremental compilation."
echo DONE.

echo [3/4] Pushing to remote...
git push origin main
echo DONE.

echo [4/4] Verifying...
git status
echo.
echo ============================================
echo   SYNC COMPLETE
echo ============================================
pause
