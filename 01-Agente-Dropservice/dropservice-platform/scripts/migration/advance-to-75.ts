import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function advanceTo75() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  MIGRATION ADVANCE: 50% → 75%');
  console.log('═══════════════════════════════════════════════════\n');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Verify current rollout is 50%
  const { data: currentFlag } = await supabase
    .from('feature_flags')
    .select('value')
    .eq('key', 'v2_rollout_percentage')
    .single();

  const currentPct = currentFlag?.value ?? 0;
  console.log(`  Current rollout: ${currentPct}%`);

  if (currentPct !== 50) {
    console.error(`  ❌ Expected 50%, got ${currentPct}%. Aborting.`);
    process.exit(1);
  }

  // 2. Update to 75%
  const { error } = await supabase
    .from('feature_flags')
    .upsert({
      key: 'v2_rollout_percentage',
      value: 75,
      updated_at: new Date().toISOString(),
      updated_by: 'migration_script',
    });

  if (error) {
    console.error(`  ❌ Failed to update: ${error.message}`);
    process.exit(1);
  }

  // 3. Log migration event
  await supabase.from('migration_metrics').insert({
    event: 'rollout_advance',
    from_percentage: 50,
    to_percentage: 75,
    advanced_by: 'advance-to-75.ts',
    created_at: new Date().toISOString(),
  });

  console.log('  ✅ Rollout advanced to 75%');
  console.log('  📊 Monitor /api/admin/migration/status for 1 hour');
  console.log('  ⏰ If stable, run advance-to-100.ts\n');
}

advanceTo75().catch((e) => {
  console.error('Migration advance failed:', e);
  process.exit(1);
});
