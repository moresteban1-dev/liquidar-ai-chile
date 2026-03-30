/**
 * POST-MIGRATION CLEANUP
 * Removes all legacy code, feature flags, and migration infrastructure.
 * Run ONLY after 24+ hours of stable 100% rollout.
 * 
 * Run: npx tsx scripts/migration/cleanup-legacy.ts
 */

import { unlink, stat } from 'fs/promises';
import { join } from 'path';

interface CleanupItem {
  readonly type: 'delete' | 'modify';
  readonly path: string;
  readonly description: string;
}

const ITEMS_TO_DELETE: CleanupItem[] = [
  // Feature flags
  {
    type: 'delete',
    path: 'src/infrastructure/feature-flags/FeatureFlags.ts',
    description: 'Feature flag system (no longer needed)',
  },
  // Migration infrastructure
  {
    type: 'delete',
    path: 'src/infrastructure/migration/LegacyAdapter.ts',
    description: 'V1 ↔ V2 payload adapter',
  },
  {
    type: 'delete',
    path: 'src/infrastructure/migration/MigrationMonitor.ts',
    description: 'V1/V2 comparison metrics',
  },
  {
    type: 'delete',
    path: 'src/infrastructure/migration/RolloutController.ts',
    description: 'Percentage-based rollout controller',
  },
  // AB Testing
  {
    type: 'delete',
    path: 'src/infrastructure/http/middleware/ABTestingMiddleware.ts',
    description: 'A/B testing middleware for v1/v2 routing',
  },
  // Migration API routes
  {
    type: 'delete',
    path: 'src/app/api/admin/migration/status/route.ts',
    description: 'Migration status endpoint',
  },
  {
    type: 'delete',
    path: 'src/app/api/admin/migration/advance/route.ts',
    description: 'Migration advance endpoint',
  },
  {
    type: 'delete',
    path: 'src/app/api/admin/migration/rollback/route.ts',
    description: 'Migration rollback endpoint',
  },
  {
    type: 'delete',
    path: 'src/app/api/admin/migration/emergency/route.ts',
    description: 'Emergency rollback endpoint',
  },
  // Migration scripts (keep for reference, move to archive)
  {
    type: 'delete',
    path: 'scripts/increase-migration.ts',
    description: 'Old migration increase script',
  },
  // Legacy test files
  {
    type: 'delete',
    path: 'tests/integration/migration/v1-v2-compatibility.test.ts',
    description: 'V1/V2 compatibility tests (no longer needed)',
  },
  {
    type: 'delete',
    path: 'tests/performance/v1-v2-comparison.test.ts',
    description: 'V1/V2 performance comparison',
  },
];

const ITEMS_TO_MODIFY: CleanupItem[] = [
  {
    type: 'modify',
    path: 'src/infrastructure/di/bindings.ts',
    description: 'Remove feature flag and migration bindings',
  },
];

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function performCleanup(dryRun: boolean) {
  console.log('═══════════════════════════════════════════════════');
  console.log(`  POST-MIGRATION CLEANUP ${dryRun ? '(DRY RUN)' : '(LIVE)'}`);
  console.log('═══════════════════════════════════════════════════\n');

  let deletedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Process deletions
  console.log('  Files to DELETE:\n');

  for (const item of ITEMS_TO_DELETE) {
    const fullPath = join(process.cwd(), item.path);
    const exists = await fileExists(fullPath);

    if (!exists) {
      console.log(`  ⏭️  ${item.path} (already removed)`);
      skippedCount++;
      continue;
    }

    if (dryRun) {
      console.log(`  🗑️  [DRY RUN] Would delete: ${item.path}`);
      console.log(`     ${item.description}`);
    } else {
      try {
        await unlink(fullPath);
        console.log(`  ✅ Deleted: ${item.path}`);
        deletedCount++;
      } catch (e) {
        console.log(`  ❌ Failed to delete: ${item.path} — ${e}`);
        errorCount++;
      }
    }
  }

  // Process modifications
  console.log('\n  Files to MODIFY:\n');

  for (const item of ITEMS_TO_MODIFY) {
    console.log(`  📝 ${dryRun ? '[DRY RUN] ' : ''}${item.path}`);
    console.log(`     ${item.description}`);
  }

  // Summary
  console.log('\n───────────────────────────────────────────────────');
  console.log(`  ${dryRun ? 'Would delete' : 'Deleted'}: ${dryRun ? (ITEMS_TO_DELETE.length - skippedCount) : deletedCount} files`);
  console.log(`  Skipped: ${skippedCount} files`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Manual modifications needed: ${ITEMS_TO_MODIFY.length}`);
  console.log('═══════════════════════════════════════════════════\n');

  if (dryRun) {
    console.log('  Run with --live to perform actual cleanup:');
    console.log('  npx tsx scripts/migration/cleanup-legacy.ts --live\n');
  }
}

const isLive = process.argv.includes('--live');
performCleanup(!isLive).catch(console.error);
