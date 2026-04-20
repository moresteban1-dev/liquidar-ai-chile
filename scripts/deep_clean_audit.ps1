## Deep Clean Audit PowerShell Script (Fixed)
# This script performs a comprehensive audit of the Dropservice platform.
# Optimized for Windows PowerShell and local environment configuration.

$ErrorActionPreference = 'Continue' # Allow script to continue even if some steps fail

# Create audit directory
if (-Not (Test-Path -Path "audit")) {
    New-Item -ItemType Directory -Path "audit" | Out-Null
}

Write-Host "--- Starting Deep Clean Audit ---" -ForegroundColor Cyan

# 1. Forensic Analysis
Write-Host "[1/10] Running forensic analysis..."
git log -p -n 50 > "audit/forensic_analysis.txt"

# 2. npm Audit
Write-Host "[2/10] Running npm audit..."
try {
    npm audit --json > "audit/npm_audit_report.json"
} catch {
    Write-Host "npm audit execution failed" -ForegroundColor Red
}

# 3. ESLint Security Analysis
Write-Host "[3/10] Running ESLint analysis..."
# Using the local flat config (eslint.config.mjs) which should be auto-detected
try {
    npx eslint . -f json -o "audit/eslint_security_report.json"
} catch {
    Write-Host "ESLint execution failed" -ForegroundColor Red
}

# 4. Secret Scanning (Gitleaks)
Write-Host "[4/10] Scanning for hard-coded secrets..."
if (Get-Command gitleaks -ErrorAction SilentlyContinue) {
    try {
        gitleaks detect --source . --report-format json -o "audit/gitleaks_report.json"
    } catch {
        Write-Host "Gitleaks scan failed" -ForegroundColor Yellow
    }
} else {
    "Gitleaks not found in path" | Out-File -FilePath "audit/gitleaks_report.json"
}

# 5. TypeScript Compilation Check
Write-Host "[5/10] Running TypeScript compilation check..."
try {
    npx tsc --noEmit > "audit/tsc_errors.txt" 2>&1
} catch {
    Write-Host "TSC check completed with errors" -ForegroundColor Yellow
}

# 6. ESLint Auto-fix (Trivial issues)
Write-Host "[6/10] Running ESLint auto-fix..."
try {
    npx eslint . --fix
} catch {
    Write-Host "ESLint auto-fix failed" -ForegroundColor Yellow
}

# 7. Code Duplication Detection
Write-Host "[7/10] Running duplicate code detection (jscpd)..."
try {
    # Adding ignore patterns to avoid scanning node_modules and builds
    npx jscpd . --output "audit/duplication" --ignore "**/node_modules/**,**/.next/**,**/.vercel/**,**/dist/**,**/build/**"
} catch {
    Write-Host "jscpd failed" -ForegroundColor Yellow
}

# 8. Testing & Coverage
Write-Host "[8/10] Running tests..."
try {
    # Check if coverage package exists, if not run without coverage
    if (Test-Path "node_modules/@vitest/coverage-v8") {
        npx vitest run --coverage > "audit/test_coverage.txt" 2>&1
    } else {
        Write-Host "@vitest/coverage-v8 not found. Running tests without coverage." -ForegroundColor Yellow
        npx vitest run > "audit/test_coverage.txt" 2>&1
    }
} catch {
    Write-Host "Tests failed" -ForegroundColor Red
}

# 9. Vercel Build Simulation
Write-Host "[9/10] Running Vercel build simulation..."
try {
    npx vercel build > "audit/vercel_build.log" 2>&1
} catch {
    Write-Host "Vercel build failed" -ForegroundColor Yellow
}

# 10. Consolidate Reports
Write-Host "[10/10] Consolidating reports..."

$forensicPreview = if (Test-Path "audit/forensic_analysis.txt") { Get-Content "audit/forensic_analysis.txt" -TotalCount 20 } else { "No forensic data" }
$npmVulns = "N/A"
if (Test-Path "audit/npm_audit_report.json") {
    $json = Get-Content "audit/npm_audit_report.json" | ConvertFrom-Json
    $npmVulns = $json.metadata.totalVulnerabilities
}

$eslintIssues = 0
if (Test-Path "audit/eslint_security_report.json") {
    $json = Get-Content "audit/eslint_security_report.json" | ConvertFrom-Json
    $eslintIssues = ($json | Measure-Object -Property errorCount -Sum).Sum
}

$tscErrorCount = 0
if (Test-Path "audit/tsc_errors.txt") {
    $tscErrorCount = (Get-Content "audit/tsc_errors.txt" | Measure-Object -Line).Lines
}

$reportMd = @"
# Deep Clean Audit Report

## 1. Forensic Analysis (Preview)
$($forensicPreview -join "`n")

## 2. Security Status
- **npm Vulnerabilities:** $npmVulns
- **ESLint Errors:** $eslintIssues
- **Gitleaks:** $(if (Test-Path "audit/gitleaks_report.json") { "Report generated" } else { "Skipped" })

## 3. Technical Health
- **TypeScript Errors:** $tscErrorCount
- **Code Duplication:** $(if (Test-Path "audit/duplication/jscpd-report.json") { "Report generated" } else { "Failed/Skipped" })
- **Tests:** $(if (Test-Path "audit/test_coverage.txt") { "Results captured" } else { "Failed" })

## 4. Build Integrity
- **Vercel Build:** $(if ((Get-Content "audit/vercel_build.log" -Raw) -match "Build Completed") { "Success" } else { "Failed" })

"@

$reportMd | Out-File -FilePath "audit/report.md" -Encoding utf8

# JSON Final Summary
$summary = [PSCustomObject]@{
    timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    npmVulns = $npmVulns
    eslintIssues = $eslintIssues
    tscErrors = $tscErrorCount
    vercelBuildSuccess = ((Get-Content "audit/vercel_build.log" -Raw) -match "Build Completed")
}

$summary | ConvertTo-Json | Out-File -FilePath "audit/report.json" -Encoding utf8

Write-Host "--- Audit Completed! Results in ./audit/ ---" -ForegroundColor Green
