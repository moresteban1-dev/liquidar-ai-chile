import fetch from 'node-fetch'; // Requires node-fetch@2 to be installed or use global fetch in Node 18+

const BASE_URL = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

async function runSmokeTests(): Promise<void> {
  console.log('🔥 Running Smoke Tests');
  console.log('======================\n');
  console.log(`Target: ${BASE_URL}\n`);

  const results: TestResult[] = [];

  // Use global fetch (Node 18+) or fallback
  const _fetch = typeof globalThis.fetch !== 'undefined' ? globalThis.fetch : fetch as any;

  // Test 1: Health Endpoint
  await test('Health Check', async () => {
    const res = await _fetch(`${BASE_URL}/api/admin/system/health`);
    if (res.status !== 200 && res.status !== 401) {
        // We expect 401 if unauthenticated, but endpoint exists
        throw new Error(`Expected responsive endpoint, got ${res.status}`);
    }
  });

  // Test 2: Public Homepage
  await test('Homepage Load', async () => {
    const res = await _fetch(BASE_URL);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // Test 3: Public Category API
  await test('Public Settings/Categories API', async () => {
    const res = await _fetch(`${BASE_URL}/api/public/categories`);
    if (res.status !== 200 && res.status !== 404) { // 404 if not implemented yet, but alive
        throw new Error(`Expected alive API response, got ${res.status}`);
    }
  });

  // Test 4: Auth Flow (unauthorized access)
  await test('Auth Protection (Admin Route)', async () => {
    const res = await _fetch(`${BASE_URL}/api/admin/system/health`);
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized for unprotected access, got ${res.status}`);
  });

  // Results
  console.log('\n📊 Test Results:');
  console.log('================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    const time = `${r.duration}ms`;
    console.log(`${icon} ${r.name.padEnd(35)} ${time.padStart(8)}`);
    if (r.error) console.log(`   └─ ${r.error}`);
  });

  console.log(`\nPassed: ${passed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ SMOKE TESTS FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ ALL SMOKE TESTS PASSED');
  }

  async function test(name: string, fn: () => Promise<void>) {
    const start = Date.now();
    try {
      await fn();
      results.push({ name, passed: true, duration: Date.now() - start });
    } catch (error) {
      results.push({ 
        name, 
        passed: false, 
        duration: Date.now() - start,
        error: (error as Error).message
      });
    }
  }
}

runSmokeTests();
