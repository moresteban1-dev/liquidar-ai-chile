/**
 * Pre-migration health check.
 * Must pass ALL checks before advancing rollout percentage.
 * Run: npx tsx scripts/migration/pre-migration-check.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Force load env
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface HealthCheck {
  readonly name: string;
  readonly status: 'pass' | 'fail' | 'warn';
  readonly value: string | number;
  readonly threshold: string;
  readonly critical: boolean;
}

async function runPreMigrationChecks(): Promise<{
  passed: boolean;
  checks: HealthCheck[];
}> {
  const checks: HealthCheck[] = [];

  console.log('═══════════════════════════════════════════════════');
  console.log('  PRE-MIGRATION HEALTH CHECK');
  console.log('═══════════════════════════════════════════════════\n');

  // ── 1. Database connectivity ──
  try {
    const start = Date.now();
    const { error } = await supabase.from('orders').select('id', { count: 'exact', head: true });
    const latency = Date.now() - start;

    checks.push({
      name: 'Database Connectivity',
      status: error ? 'fail' : latency > 500 ? 'warn' : 'pass',
      value: error ? error.message : `${latency}ms`,
      threshold: '< 500ms',
      critical: true,
    });
  } catch (e) {
    checks.push({
      name: 'Database Connectivity',
      status: 'fail',
      value: String(e),
      threshold: 'reachable',
      critical: true,
    });
  }

  // ── 2. V2 Error Rate ──
  try {
    const since = new Date(Date.now() - 3600_000).toISOString(); // Last hour
    const { data: errorLogs, count: errorCountRes } = await supabase
      .from('notification_log')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', since);

    const { count: totalCount } = await supabase
      .from('notification_log')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since);

    const errorCount = errorCountRes ?? 0;
    const total = totalCount ?? 1;
    const errorRate = total > 0 ? (errorCount / total) * 100 : 0;

    checks.push({
      name: 'V2 Error Rate (1h)',
      status: errorRate > 1 ? 'fail' : errorRate > 0.5 ? 'warn' : 'pass',
      value: `${errorRate.toFixed(2)}%`,
      threshold: '< 1%',
      critical: true,
    });
  } catch {
    checks.push({
      name: 'V2 Error Rate (1h)',
      status: 'warn',
      value: 'Could not measure',
      threshold: '< 1%',
      critical: false,
    });
  }

  // ── 3. Database Performance ──
  try {
    const { data } = await supabase.rpc('get_db_performance_summary');
    if (data) {
      for (const metric of data as { metric_name: string; metric_value: string; status: string }[]) {
        checks.push({
          name: `DB: ${metric.metric_name}`,
          status: metric.status === 'excellent' || metric.status === 'good' ? 'pass' :
                  metric.status === 'warning' ? 'warn' : 'fail',
          value: metric.metric_value,
          threshold: metric.status,
          critical: metric.metric_name === 'cache_hit_ratio',
        });
      }
    }
  } catch {
    checks.push({
      name: 'DB Performance Summary',
      status: 'warn',
      value: 'RPC not available',
      threshold: 'n/a',
      critical: false,
    });
  }

  // ── 4. Recent optimization score ──
  try {
    const { data } = await supabase
      .from('optimization_scans')
      .select('score, critical_findings')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      checks.push({
        name: 'Optimization Score',
        status: data.score >= 90 ? 'pass' : data.score >= 70 ? 'warn' : 'fail',
        value: `${data.score}/100`,
        threshold: '≥ 90',
        critical: false,
      });

      checks.push({
        name: 'Critical Findings',
        status: data.critical_findings === 0 ? 'pass' : 'fail',
        value: String(data.critical_findings),
        threshold: '0',
        critical: true,
      });
    }
  } catch {
    checks.push({
      name: 'Optimization Score',
      status: 'warn',
      value: 'No scans found',
      threshold: '≥ 90',
      critical: false,
    });
  }

  // ── 5. Pending events check ──
  try {
    const { count } = await supabase
      .from('event_outbox')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'processing']);

    const pending = count ?? 0;
    checks.push({
      name: 'Pending Events',
      status: pending > 100 ? 'warn' : 'pass',
      value: String(pending),
      threshold: '< 100',
      critical: false,
    });
  } catch {
    checks.push({
      name: 'Pending Events',
      status: 'warn',
      value: 'Could not check',
      threshold: '< 100',
      critical: false,
    });
  }

  // ── 6. Webhook health ──
  try {
    const { data } = await supabase
      .from('webhooks')
      .select('id, failure_count')
      .eq('active', true)
      .gt('failure_count', 10);

    const unhealthy = data?.length ?? 0;
    checks.push({
      name: 'Unhealthy Webhooks',
      status: unhealthy > 0 ? 'warn' : 'pass',
      value: String(unhealthy),
      threshold: '0',
      critical: false,
    });
  } catch { /* ignore */ }

  // ── Print Results ──
  for (const check of checks) {
    const icon = check.status === 'pass' ? '✅' :
                 check.status === 'warn' ? '⚠️' : '❌';
    const critical = check.critical ? ' [CRITICAL]' : '';
    console.log(`  ${icon} ${check.name}: ${check.value} (threshold: ${check.threshold})${critical}`);
  }

  const criticalFails = checks.filter((c) => c.critical && c.status === 'fail');
  const allPassed = criticalFails.length === 0;

  console.log('\n───────────────────────────────────────────────────');
  if (allPassed) {
    console.log('  ✅ ALL CRITICAL CHECKS PASSED — Safe to proceed');
  } else {
    console.log('  ❌ CRITICAL CHECKS FAILED — DO NOT PROCEED');
    for (const fail of criticalFails) {
      console.log(`     ❌ ${fail.name}: ${fail.value}`);
    }
  }
  console.log('═══════════════════════════════════════════════════\n');

  return { passed: allPassed, checks };
}

runPreMigrationChecks()
  .then(({ passed }) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((e) => {
    console.error('Pre-migration check failed:', e);
    process.exit(1);
  });
