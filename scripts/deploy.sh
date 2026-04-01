#!/bin/bash

# ============================================
# PRODUCTION DEPLOYMENT SCRIPT
# ============================================

set -e

echo "═══════════════════════════════════════════════"
echo "  🚀 DROPSERVICE PLATFORM - Production Deploy"
echo "═══════════════════════════════════════════════"
echo ""

# 1. Pre-flight checks
echo "📋 Step 1: Pre-flight checks..."

echo "  Checking Node.js version..."
node_version=$(node -v)
echo "  Node.js: $node_version ✅"

# 2. Type checking
echo ""
echo "📋 Step 2: Type checking..."
npm run type-check
echo "  TypeScript: OK ✅"

# 3. Linting
echo ""
echo "📋 Step 3: Linting..."
npm run lint
echo "  ESLint: OK ✅"

# 4. Testing
echo ""
echo "📋 Step 4: Running tests..."
npm run test
echo "  Tests: OK ✅"

# 5. Build
echo ""
echo "📋 Step 5: Building..."
npm run build
echo "  Build: OK ✅"

# 6. Deploy
echo ""
echo "📋 Step 6: Deploying to Vercel..."
vercel --prod --yes
echo "  Deploy: OK ✅"

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETED SUCCESSFULLY"
echo "═══════════════════════════════════════════════"
