@echo off
echo ╔══════════════════════════════════════════════════════╗
echo ║  🔬 DATOS CRUDOS PARA INFORME EXHAUSTIVO             ║
echo ╚══════════════════════════════════════════════════════╝
echo.

echo ═══ 1/6 TSC — POR TIPO DE ERROR ═══
npx tsc --noEmit > tsc_full.txt 2>&1
findstr "error TS" tsc_full.txt > tsc_errors.txt
powershell -Command "Get-Content tsc_errors.txt | ForEach-Object { if ($_ -match 'error (TS\d+):') { $matches[1] } } | Group-Object | Sort-Object Count -Descending | Select-Object Count, Name"

echo.
echo ═══ 2/6 TSC — TOP 25 ARCHIVOS ═══
powershell -Command "Get-Content tsc_errors.txt | ForEach-Object { $_.ToString().Split('(')[0].Trim() } | Group-Object | Sort-Object Count -Descending | Select-Object -First 25 | Select-Object Count, Name"

echo.
echo ═══ 3/6 TSC — PRIMEROS 60 ERRORES COMPLETOS ═══
powershell -Command "Get-Content tsc_errors.txt | Select-Object -First 60"

echo.
echo ═══ 4/6 SEGURIDAD — RUTAS API SIN AUTH ═══
powershell -Command "Get-ChildItem -Path 'src/app/api' -Filter 'route.ts*' -Recurse | ForEach-Object { $c = Get-Content $_.FullName -Raw; $has = $c -match 'getServerSession|auth\(|getSession|requireAdmin|requireAuth|getUser|cookies\(\)'; if (-not $has) { Write-Host '  ❌' $_.FullName } }"

echo.
echo ═══ 5/6 INFRAESTRUCTURA — PROMESAS NO AWAITED ═══
powershell -Command "Get-ChildItem -Path 'src/infrastructure' -Filter '*.ts' -Recurse | ForEach-Object { $lines = Get-Content $_.FullName; for ($i=0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match 'supabase\.|\.from\(' -and $lines[$i] -notmatch 'await|//') { Write-Host ('  ' + $_.FullName + ':' + ($i+1) + ': ' + $lines[$i].Trim()) } } } | Select-Object -First 20"

echo.
echo ═══ 6/6 PERFORMANCE — USE CLIENT INNECESARIOS ═══
powershell -Command "Get-ChildItem -Path 'src' -Filter '*.tsx' -Recurse | ForEach-Object { $c = Get-Content $_.FullName -Raw; if ($c -match '''use client''|\"use client\"' -and $c -notmatch 'useState|useEffect|useRef|useCallback|onClick|onChange|onSubmit') { Write-Host '  ⚠️ ' $_.FullName } }"

echo.
echo ═══ TOTAL TSC ═══
powershell -Command "(Get-Content tsc_errors.txt).Count"
