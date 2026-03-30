#!/usr/bin/env npx ts-node
// scripts/pre-deploy-check.ts
// Validación pre-deploy para evitar builds "zombies" (NASA Grade v2)

import { execSync } from 'child_process';

console.log('🔍 Running pre-deploy checks (NASA Grade v2)...\n');

let hasErrors = false;

// 1. Check Env Vars
console.log('📋 Checking environment variables...');
const requiredPublicVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

for (const varName of requiredPublicVars) {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.warn(`  ⚠️ Missing local env var: ${varName} (Expected in CI/CD)`);
  } else {
    console.log(`  ✅ ${varName} is set`);
  }
}

// 2. TSC Check
console.log('\n📋 Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('  ✅ TypeScript check passed');
} catch (error) {
  console.error('  ❌ TypeScript check failed');
  hasErrors = true;
}

// 3. Build Test (Local)
console.log('\n📋 Testing production build (Next.js)...');
try {
  execSync('npm run build', { 
     stdio: 'inherit',
     env: { ...process.env, SKIP_ENV_VALIDATION: 'true' } 
  });
  console.log('  ✅ Build successful');
} catch (error) {
  console.error('  ❌ Build failed');
  hasErrors = true;
}

if (hasErrors) {
  console.log('\n🔴 Pre-deploy check FAILED. Fix issues before pushing.');
  process.exit(1);
} else {
  console.log('\n🟢 Pre-deploy check PASSED. Ready to fly. 🚀');
  process.exit(0);
}
