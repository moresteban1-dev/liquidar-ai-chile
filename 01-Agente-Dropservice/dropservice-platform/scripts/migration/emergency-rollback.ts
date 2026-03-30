import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * EMERGENCY ROLLBACK
 * Instantly reverts to previous rollout percentage.
 * Run: npx tsx scripts/migration/emergency-rollback.ts [target-percentage]
 */

async function emergencyRollback() {
  const targetPct = parseInt(process.argv[2] ?? '50', 10);

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  ⚠️  EMERGENCY ROLLBACK                          ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Target: ${targetPct}%                                     ║`);
  console.log('╚══════════════════════════════════════════════════╝\n');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get current state
  const { data: currentFlag } = await supabase
    .from('feature_flags')
    .select('value')
    .eq('key', 'v2_rollout_percentage')
    .single();

  const currentPct = currentFlag?.value ?? 100;
  console.log(`  Current rollout: ${currentPct}%`);
  console.log(`  Rolling back to: ${targetPct}%\n`);

  // Rollback
  const { error } = await supabase
    .from('feature_flags')
    .upsert({
      key: 'v2_rollout_percentage',
      value: targetPct,
      updated_at: new Date().toISOString(),
      updated_by: 'emergency_rollback',
    });

  if (error) {
    console.error(`  ❌ ROLLBACK FAILED: ${error.message}`);
    console.error('  MANUAL INTERVENTION REQUIRED');
    process.exit(1);
  }

  // Clear migration complete flag if rolling back from 100%
  if (currentPct === 100) {
    await supabase
      .from('feature_flags')
      .upsert({
        key: 'v2_migration_complete',
        value: false,
        updated_at: new Date().toISOString(),
        updated_by: 'emergency_rollback',
      });
  }

  // Log rollback event
  await supabase.from('migration_metrics').insert({
    event: 'emergency_rollback',
    from_percentage: currentPct,
    to_percentage: targetPct,
    advanced_by: 'emergency_rollback',
    metadata: {
      reason: process.argv[3] ?? 'No reason provided',
      rolledBackAt: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  });

  console.log(`  ✅ ROLLED BACK to ${targetPct}%`);
  console.log('  📊 Monitor system immediately');
  console.log('  📝 Document the incident\n');
}

emergencyRollback().catch((e) => {
  console.error('ROLLBACK FAILED:', e);
  process.exit(1);
});
