#!/usr/bin/env bash
set -e

# Create audit directory
mkdir -p audit

# 1. Forensic analysis (last 100 commits)
git log -p -n 100 > audit/forensic_analysis.txt

# 2. npm audit report
npm audit --json > audit/npm_audit_report.json || echo "npm audit failed"

# 3. ESLint security analysis (JSON report)
# Assuming .eslintrc.json includes security rules
npx eslint . -c .eslintrc.json -f json -o audit/eslint_security_report.json || echo "eslint security analysis failed"

# 4. Scan for hard‑coded secrets using gitleaks (if installed)
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --source . --report-format json -o audit/gitleaks_report.json || echo "gitleaks scan failed"
else
  echo "gitleaks not installed, skipping" > audit/gitleaks_report.json
fi

# 5. OWASP ZAP DAST scan (placeholder – requires running server)
# You may run zap-cli or dockerized ZAP against http://localhost:3000
# echo "Running OWASP ZAP scan..." > audit/owasp_zap_report.json

# 6. TypeScript compilation check (no emit)
npx tsc --noEmit > audit/tsc_errors.txt || echo "tsc errors captured"

# 7. Auto‑fix lint issues (may modify source files)
npx eslint . --fix || echo "eslint --fix failed"

# 8. Duplicate code detection using jscpd
npx jscpd . --reporter json --output audit/duplication_report.json || echo "jscpd failed"

# 9. Run unit/integration tests with coverage
npx vitest run --coverage > audit/test_coverage.txt || echo "tests failed"

# 10. Docker compose build (if docker-compose.yml exists)
if [ -f docker-compose.yml ]; then
  docker compose build > audit/docker_build.log 2>&1 || echo "docker compose build failed"
fi

# 11. Vercel build simulation
npx vercel build > audit/vercel_build.log 2>&1 || echo "vercel build failed"

# 12. Consolidate report (simple summary)
cat <<EOF > audit/report.md
# Deep Clean Audit Report

## Forensic Analysis
$(head -n 20 audit/forensic_analysis.txt)

## npm Audit Summary
$(jq '.metadata.totalVulnerabilities' audit/npm_audit_report.json 2>/dev/null || echo "N/A")

## ESLint Security Findings
$(jq '.length' audit/eslint_security_report.json 2>/dev/null || echo "0") issues found.

## TypeScript Errors
$(wc -l < audit/tsc_errors.txt) lines.

## Test Coverage
$(tail -n 5 audit/test_coverage.txt)

## Docker Build Log
$(tail -n 5 audit/docker_build.log)

## Vercel Build Log
$(tail -n 5 audit/vercel_build.log)

EOF

# JSON summary
jq -n '{forensic: ("$(head -n 5 audit/forensic_analysis.txt)"), npmVulns: ("$(jq ".metadata.totalVulnerabilities" audit/npm_audit_report.json 2>/dev/null)"), eslintIssues: ("$(jq ".length" audit/eslint_security_report.json 2>/dev/null)"), tscErrors: ("$(wc -l < audit/tsc_errors.txt)"), testCoverage: ("$(tail -n 5 audit/test_coverage.txt)"), dockerBuild: ("$(tail -n 5 audit/docker_build.log)"), vercelBuild: ("$(tail -n 5 audit/vercel_build.log)")}' > audit/report.json

echo "Deep Clean Audit completed. Reports generated in ./audit/"
