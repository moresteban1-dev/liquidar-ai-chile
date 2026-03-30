#!/bin/bash
# load-tests/run-all.sh

set -e

echo "═══════════════════════════════════════════════"
echo "  DROPSERVICE LOAD TEST SUITE"
echo "═══════════════════════════════════════════════"
echo ""

# Configuration
export BASE_URL="${BASE_URL:-http://localhost:3000}"
export ADMIN_TOKEN="${ADMIN_TOKEN:-}"
export PROVIDER_TOKEN="${PROVIDER_TOKEN:-}"
export CLIENT_TOKEN="${CLIENT_TOKEN:-}"
export PROVIDER_ID="${PROVIDER_ID:-}"

RESULTS_DIR="load-tests/results/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo "Base URL: $BASE_URL"
echo "Results: $RESULTS_DIR"
echo ""

# Check k6 is installed
if ! command -v k6 &> /dev/null; then
  echo "❌ k6 is not installed. Install: https://k6.io/docs/get-started/installation/"
  exit 1
fi

# Check tokens
if [ -z "$ADMIN_TOKEN" ] || [ -z "$CLIENT_TOKEN" ]; then
  echo "⚠️  Warning: Auth tokens not set. Set ADMIN_TOKEN, PROVIDER_TOKEN, CLIENT_TOKEN"
  echo "   Tests requiring auth will fail."
  echo ""
fi

run_test() {
  local name=$1
  local file=$2
  local description=$3

  echo "───────────────────────────────────────────────"
  echo "  Running: $name"
  echo "  $description"
  echo "───────────────────────────────────────────────"

  k6 run \
    --out json="$RESULTS_DIR/${name}.json" \
    --summary-export="$RESULTS_DIR/${name}_summary.json" \
    "$file" 2>&1 | tee "$RESULTS_DIR/${name}.log"

  local exit_code=$?
  if [ $exit_code -eq 0 ]; then
    echo "  ✅ $name PASSED"
  else
    echo "  ❌ $name FAILED (exit code: $exit_code)"
  fi
  echo ""

  return $exit_code
}

# ── Run Tests ──

echo ""
echo "Phase 1: Smoke Test"
run_test "smoke" "load-tests/smoke.test.js" "5 VUs × 1 min — Basic functionality"

echo ""
echo "Phase 2: Business Flow Test"
run_test "business_flow" "load-tests/business-flow.test.js" "30 VUs × 5 min — Complete user journeys"

echo ""
echo "Phase 3: Normal Load Test"
run_test "normal" "load-tests/normal.test.js" "50 VUs × 10 min — Baseline production traffic"

echo ""
echo "Phase 4: Peak Load Test"
run_test "peak" "load-tests/peak.test.js" "200 VUs × 5 min — 4x traffic spike"

echo ""
echo "Phase 5: Stress Test"
run_test "stress" "load-tests/stress.test.js" "Ramp to 500 VUs — Finding breaking point"

echo ""
echo "═══════════════════════════════════════════════"
echo "  ALL TESTS COMPLETE"
echo "  Results saved to: $RESULTS_DIR"
echo "═══════════════════════════════════════════════"
