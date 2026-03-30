# scripts/debug_pds.ps1
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🔬 DATOS CRUDOS PARA INFORME EXHAUSTIVO             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════
# BLOQUE 1: TYPESCRIPT
# ═══════════════════════════════════════════
Write-Host "═══ 1/6 TSC — POR TIPO DE ERROR ═══" -ForegroundColor Yellow
$tscOutput = npx tsc --noEmit 2>&1
$errors = $tscOutput | Select-String "error TS"
$errorCounts = $errors | ForEach-Object { 
    if ($_ -match "error (TS\d+):") { $matches[1] } 
} | Group-Object | Sort-Object Count -Descending
$errorCounts | Select-Object Count, Name

Write-Host ""
Write-Host "═══ 2/6 TSC — TOP 25 ARCHIVOS ═══" -ForegroundColor Yellow
$fileCounts = $errors | ForEach-Object { 
    $_.ToString().Split("(")[0].Trim() 
} | Group-Object | Sort-Object Count -Descending | Select-Object -First 25
$fileCounts | Select-Object Count, Name

Write-Host ""
Write-Host "═══ 3/6 TSC — PRIMEROS 60 ERRORES COMPLETOS ═══" -ForegroundColor Yellow
$errors | Select-Object -First 60

# ═══════════════════════════════════════════
# BLOQUE 2: SEGURIDAD
# ═══════════════════════════════════════════
Write-Host ""
Write-Host "═══ 4/6 SEGURIDAD — RUTAS API SIN AUTH ═══" -ForegroundColor Yellow
Get-ChildItem -Path "src/app/api" -Filter "route.ts*" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $hasAuth = $content -match "getServerSession|auth\(|getSession|requireAdmin|requireAuth|getUser|cookies\(\)"
    $methods = [regex]::Matches($content, "export.*function (GET|POST|PUT|DELETE|PATCH)").Value | ForEach-Object { 
        if ($_ -match "(GET|POST|PUT|DELETE|PATCH)") { $matches[1] } 
    }
    if (-not $hasAuth -and $methods) {
        Write-Host "  ❌ $($_.FullName) [$($methods -join ', ')]" -ForegroundColor Red
    }
}

# ═══════════════════════════════════════════
# BLOQUE 3: INFRAESTRUCTURA
# ═══════════════════════════════════════════
Write-Host ""
Write-Host "═══ 5/6 INFRAESTRUCTURA — PROMESAS NO AWAITED ═══" -ForegroundColor Yellow
$infraFiles = Get-ChildItem -Path "src/infrastructure" -Filter "*.ts" -Recurse | Where-Object { $_.Name -notmatch "\.test\." }
foreach ($file in $infraFiles) {
    $lines = Get-Content $file.FullName
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line -match "supabase\.|\.from\(" -and $line -notmatch "await|//") {
            Write-Host "  $($file.FullName):$($i+1): $($line.Trim())"
        }
    }
} | Select-Object -First 20

# ═══════════════════════════════════════════
# BLOQUE 4: PERFORMANCE
# ═══════════════════════════════════════════
Write-Host ""
Write-Host "═══ 6/6 PERFORMANCE — USE CLIENT INNECESARIOS ═══" -ForegroundColor Yellow
Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match "'use client'|\"use client\"") {
        $hasHooks = $content -match "useState|useEffect|useRef|useCallback|onClick|onChange|onSubmit"
        if (-not $hasHooks) {
            Write-Host "  ⚠️  $($_.FullName) (use client sin hooks)" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "═══ TOTAL TSC ═══" -ForegroundColor Yellow
$errors.Count | Write-Host
