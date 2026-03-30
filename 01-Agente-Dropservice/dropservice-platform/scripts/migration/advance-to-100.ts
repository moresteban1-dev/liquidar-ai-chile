import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function advanceTo100() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  MIGRATION ADVANCE: 75% → 100%');
  console.log('  ⚠️  THIS IS THE FINAL MIGRATION STEP');
  console.log('═══════════════════════════════════════════════════\n');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Verify current rollout is 75%
  const { data: currentFlag } = await supabase
    .from('feature_flags')
    .select('value')
    .eq('key', 'v2_rollout_percentage')
    .single();

  const currentPct = currentFlag?.value ?? 0;
  console.log(`  Current rollout: ${currentPct}%`);

  if (currentPct !== 75) {
    console.error(`  ❌ Expected 75%, got ${currentPct}%. Aborting.`);
    process.exit(1);
  }

  // 2. Double-check health
  console.log('\n  Running final health check...\n');

  const { count: errorCountRes } = await supabase
    .from('notification_log')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gte('created_at', new Date(Date.now() - 3600_000).toISOString());

  const errorCount = errorCountRes ?? 0;
  if (errorCount > 10) {
    console.error(`  ❌ ${errorCount} errors in last hour. Too many. Aborting.`);
    process.exit(1);
  }

  console.log(`  Errors in last hour: ${errorCount} (OK)`);

  // 3. Advance to 100%
  const { error } = await supabase
    .from('feature_flags')
    .upsert({
      key: 'v2_rollout_percentage',
      value: 100,
      updated_at: new Date().toISOString(),
      updated_by: 'migration_script',
    });

  if (error) {
    console.error(`  ❌ Failed to update: ${error.message}`);
    process.exit(1);
  }

  // 4. Mark migration as complete
  await supabase.from('feature_flags').upsert({
    key: 'v2_migration_complete',
    value: true,
    updated_at: new Date().toISOString(),
    updated_by: 'migration_script',
  });

  // 5. Log final migration event
  await supabase.from('migration_metrics').insert({
    event: 'migration_complete',
    from_percentage: 75,
    to_percentage: 100,
    advanced_by: 'advance-to-100.ts',
    metadata: {
      completedAt: new Date().toISOString(),
      finalErrorCount: errorCount,
    },
    created_at: new Date().toISOString(),
  });

  console.log('\n  ✅ MIGRATION COMPLETE — 100% on V2');
  console.log('  🎉 All traffic is now on the new architecture');
  console.log('\n  Next steps:');
  console.log('  1. Monitor for 24 hours');
  console.log('  2. Run: npx tsx scripts/migration/cleanup-legacy.ts');
  console.log('  3. Deploy cleanup branch\n');
}

advanceTo100().catch((e) => {
  console.error('Migration advance failed:', e);
  process.exit(1);
});
