-- ============================================
-- QUERY OPTIMIZATION INDEXES
-- Sprint 3 - Server-side filtering support
-- ============================================

-- Composite index for the most common query pattern:
-- Orders by client + state + date (used by ListOrdersByClient)
CREATE INDEX IF NOT EXISTS idx_orders_client_state_date
ON orders(client_id, state, event_date DESC)
WHERE deleted_at IS NULL;

-- Composite index for provider queries
CREATE INDEX IF NOT EXISTS idx_orders_provider_state_date
ON orders(provider_id, state, created_at DESC)
WHERE deleted_at IS NULL AND provider_id IS NOT NULL;

-- Index for active orders count
CREATE INDEX IF NOT EXISTS idx_orders_active_count
ON orders(state)
WHERE deleted_at IS NULL
  AND state NOT IN ('COMPLETED', 'CANCELLED');

-- Index for event date range queries
CREATE INDEX IF NOT EXISTS idx_orders_event_date_range
ON orders(event_date, state)
WHERE deleted_at IS NULL;

-- Quotation indexes
CREATE INDEX IF NOT EXISTS idx_quotations_order_status
ON quotations(order_id, status, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_quotations_provider_pending
ON quotations(provider_id, status)
WHERE deleted_at IS NULL
  AND status IN ('DRAFT', 'SUBMITTED');

-- Domain events processing index
CREATE INDEX IF NOT EXISTS idx_events_unprocessed_ordered
ON domain_events(occurred_at ASC)
WHERE processed = FALSE AND retry_count < 3;

-- Migration metrics index
CREATE INDEX IF NOT EXISTS idx_migration_metrics_recent
ON migration_metrics(endpoint, version, created_at DESC)
WHERE created_at > NOW() - INTERVAL '1 hour';

-- ============================================
-- ANALYZE for query planner
-- ============================================
ANALYZE orders;
ANALYZE quotations;
ANALYZE order_pricing;
ANALYZE domain_events;
ANALYZE migration_metrics;
