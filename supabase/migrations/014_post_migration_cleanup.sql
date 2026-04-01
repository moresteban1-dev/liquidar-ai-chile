-- supabase/migrations/014_post_migration_cleanup.sql
-- Run AFTER confirming stable 100% rollout

-- ═══════════════════════════════════════════════════════════
-- Mark feature flags as deprecated
-- ═══════════════════════════════════════════════════════════

-- Don't delete data — mark as deprecated for audit trail
UPDATE feature_flags
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'),
  '{deprecated}',
  'true'::jsonb
)
WHERE key IN (
  'v2_rollout_percentage',
  'v2_migration_complete',
  'use_new_order_handler',
  'use_new_quotation_handler',
  'use_new_notification_system'
);

-- ═══════════════════════════════════════════════════════════
-- Archive migration metrics (move to archive table)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS migration_metrics_archive (
  LIKE migration_metrics INCLUDING ALL
);

INSERT INTO migration_metrics_archive
SELECT * FROM migration_metrics;

-- Keep only last 10 entries in active table
DELETE FROM migration_metrics
WHERE id NOT IN (
  SELECT id FROM migration_metrics
  ORDER BY created_at DESC
  LIMIT 10
);

-- ═══════════════════════════════════════════════════════════
-- Clean up old event outbox entries (completed)
-- ═══════════════════════════════════════════════════════════

DELETE FROM event_outbox
WHERE status = 'completed'
  AND created_at < NOW() - INTERVAL '30 days';

DELETE FROM event_outbox
WHERE status = 'dead'
  AND created_at < NOW() - INTERVAL '7 days';

-- ═══════════════════════════════════════════════════════════
-- Vacuum tables after bulk deletes
-- ═══════════════════════════════════════════════════════════

VACUUM ANALYZE migration_metrics;
VACUUM ANALYZE event_outbox;
VACUUM ANALYZE notification_log;
VACUUM ANALYZE webhook_deliveries;

-- ═══════════════════════════════════════════════════════════
-- Update table comments for documentation
-- ═══════════════════════════════════════════════════════════

COMMENT ON TABLE feature_flags IS 'Runtime feature flags. Migration flags deprecated post-v2.';
COMMENT ON TABLE migration_metrics IS 'Migration rollout history. Archived entries in migration_metrics_archive.';
