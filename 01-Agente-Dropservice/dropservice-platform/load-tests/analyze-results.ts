/**
 * Analyzes k6 JSON summary output and generates a report.
 * Run: npx tsx load-tests/analyze-results.ts <results-dir>
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

interface K6Summary {
  metrics: Record<string, {
    type: string;
    contains: string;
    values: Record<string, number>;
    thresholds?: Record<string, boolean>;
  }>;
}

interface TestResult {
  name: string;
  passed: boolean;
  metrics: {
    requests: number;
    rps: number;
    p50: number;
    p95: number;
    p99: number;
    errorRate: number;
    dataReceived: string;
  };
  thresholds: { name: string; passed: boolean }[];
}

async function analyzeResults(resultsDir: string) {
  const files = await readdir(resultsDir);
  const summaryFiles = files.filter((f) => f.endsWith('_summary.json'));

  const results: TestResult[] = [];

  for (const file of summaryFiles) {
    const content = await readFile(join(resultsDir, file), 'utf-8');
    const summary: K6Summary = JSON.parse(content);
    const testName = file.replace('_summary.json', '');

    const httpDuration = summary.metrics['http_req_duration'];
    const httpReqs = summary.metrics['http_reqs'];
    const httpFailed = summary.metrics['http_req_failed'];
    const dataReceived = summary.metrics['data_received'];

    const thresholds: { name: string; passed: boolean }[] = [];
    for (const [metricName, metric] of Object.entries(summary.metrics)) {
      if (metric.thresholds) {
        for (const [threshold, passed] of Object.entries(metric.thresholds)) {
          thresholds.push({ name: `${metricName}: ${threshold}`, passed });
        }
      }
    }

    const allPassed = thresholds.every((t) => t.passed);

    results.push({
      name: testName,
      passed: allPassed,
      metrics: {
        requests: httpReqs?.values?.count ?? 0,
        rps: httpReqs?.values?.rate ?? 0,
        p50: httpDuration?.values?.['p(50)'] ?? 0,
        p95: httpDuration?.values?.['p(95)'] ?? 0,
        p99: httpDuration?.values?.['p(99)'] ?? 0,
        errorRate: httpFailed?.values?.rate ?? 0,
        dataReceived: formatBytes(dataReceived?.values?.count ?? 0),
      },
      thresholds,
    });
  }

  // Print report
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                   LOAD TEST RESULTS REPORT                      ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣\n');

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name.toUpperCase()}`);
    console.log(`   Requests:    ${result.metrics.requests.toLocaleString()} (${result.metrics.rps.toFixed(1)} req/s)`);
    console.log(`   P50 Latency: ${result.metrics.p50.toFixed(1)}ms`);
    console.log(`   P95 Latency: ${result.metrics.p95.toFixed(1)}ms`);
    console.log(`   P99 Latency: ${result.metrics.p99.toFixed(1)}ms`);
    console.log(`   Error Rate:  ${(result.metrics.errorRate * 100).toFixed(3)}%`);
    console.log(`   Data:        ${result.metrics.dataReceived}`);

    const failedThresholds = result.thresholds.filter((t) => !t.passed);
    if (failedThresholds.length > 0) {
      console.log(`   ⚠️  Failed thresholds:`);
      for (const t of failedThresholds) {
        console.log(`      ❌ ${t.name}`);
      }
    }
    console.log('');
  }

  // Summary
  const allPassed = results.every((r) => r.passed);
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  OVERALL: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}${' '.repeat(allPassed ? 21 : 18)}║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // Performance baseline
  const normalResult = results.find((r) => r.name === 'normal');
  if (normalResult) {
    console.log('PRODUCTION BASELINE (Normal Load):');
    console.log(`  Sustained throughput: ${normalResult.metrics.rps.toFixed(0)} req/s`);
    console.log(`  P95 Latency:          ${normalResult.metrics.p95.toFixed(0)}ms`);
    console.log(`  Error Rate:           ${(normalResult.metrics.errorRate * 100).toFixed(3)}%`);
    console.log('');
  }

  const peakResult = results.find((r) => r.name === 'peak');
  if (peakResult) {
    console.log('PEAK CAPACITY:');
    console.log(`  Max throughput: ${peakResult.metrics.rps.toFixed(0)} req/s`);
    console.log(`  P95 at peak:    ${peakResult.metrics.p95.toFixed(0)}ms`);
    console.log(`  Error at peak:  ${(peakResult.metrics.errorRate * 100).toFixed(3)}%`);
    console.log('');
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// Run
const dir = process.argv[2];
if (!dir) {
  console.error('Usage: npx tsx load-tests/analyze-results.ts <results-dir>');
  process.exit(1);
}
analyzeResults(dir).catch(console.error);
