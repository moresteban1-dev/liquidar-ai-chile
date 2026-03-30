#!/bin/bash
# load-tests/run-soak.sh
# Separate script for soak test (2 hours)

set -e

export BASE_URL="${BASE_URL:-http://localhost:3000}"
RESULTS_DIR="load-tests/results/soak_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo "═══════════════════════════════════════════════"
echo "  SOAK TEST — 2 hours"
echo "  50 VUs sustained"
echo "═══════════════════════════════════════════════"

k6 run \
  --out json="$RESULTS_DIR/soak.json" \
  --summary-export="$RESULTS_DIR/soak_summary.json" \
  load-tests/soak.test.js 2>&1 | tee "$RESULTS_DIR/soak.log"

echo ""
echo "Soak test complete. Results: $RESULTS_DIR"
