@echo off
echo ==============================================
echo 🚀 Sincronizando Skill IA (Dropservice Platform) con GitHub...
echo ==============================================

:: Si la consola esta en otra ruta, entrar a Skill IA
cd /d "%~dp0"

echo 1. Buscando cambios...
git add .

echo 2. Guardando version...
:: Obtener fecha y hora actual para el mensaje de commit
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set date_str=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%

git commit -m "Auto-sync: %date_str%"

echo 3. Subiendo a GitHub...
git push origin main

echo.
echo ==============================================
echo ✅ ¡Sincronizado Exitosamente!
echo ==============================================
pause
