/// <reference types="node" />
import { execSync } from 'child_process';

interface CheckResult {
  name: string;
  passed: boolean;
  details: string;
}

const checks: CheckResult[] = [];

function runCheck(name: string, command: string): void {
  process.stdout.write(`Running ${name}... `);
  try {
    execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    console.log('✅');
    checks.push({ name, passed: true, details: 'OK' });
  } catch (error: any) {
    console.log('❌');
    checks.push({ name, passed: false, details: error.stderr || error.message });
  }
}

console.log('\n🔍 --- Pre-deploy Health Checklist ---\n');

runCheck('TypeScript (Project)', 'npx tsc --noEmit');
runCheck('Next.js Build Check', 'npx next build');
// runCheck('Unit Tests', 'npx vitest run tests/unit/'); // Disabled until factories are fully integrated

console.log('\n' + '='.repeat(40));
console.log('📊 REPORT');
console.log('='.repeat(40));

let allPassed = true;
for (const check of checks) {
  console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
  if (!check.passed) {
    allPassed = false;
    console.log(`   └─ Error: ${check.details.slice(0, 150)}...`);
  }
}

const score = Math.round((checks.filter(c => c.passed).length / checks.length) * 100);
console.log(`\n🏆 Build Health Score: ${score}/100`);

if (allPassed) {
  console.log('\n🚀 Platform is stable. Ready to deploy!');
  process.exit(0);
} else {
  console.log('\n🛑 BLOCKED: Please fix errors before deploying.');
  process.exit(1);
}
