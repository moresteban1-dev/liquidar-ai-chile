-- supabase/migrations/013_dashboard_stats_function.sql

-- ═══════════════════════════════════════════════════════════
-- FUNCTION: Dashboard aggregation in single query
-- Eliminates N+1 on admin dashboard
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalOrders', (
      SELECT COUNT(*)::INTEGER
      FROM orders
      WHERE deleted_at IS NULL
    ),
    'byStatus', (
      SELECT COALESCE(
        json_object_agg(state, cnt),
        '{}'::JSON
      )
      FROM (
        SELECT state, COUNT(*)::INTEGER AS cnt
        FROM orders
        WHERE deleted_at IS NULL
        GROUP BY state
      ) status_counts
    ),
    'totalRevenue', (
      SELECT COALESCE(SUM(amount), 0)::FLOAT
      FROM order_pricing op
      JOIN orders o ON o.id = op.order_id
      WHERE o.state = 'PAYMENT_RECEIVED'
        OR o.state = 'IN_PRODUCTION'
        OR o.state = 'DELIVERED'
        OR o.state = 'COMPLETED'
        AND o.deleted_at IS NULL
    ),
    'totalProfit', (
      -- Placeholder for profit calculation if available in schema
      -- For now, using a simplified version or 0 if not implemented in DB
      0::FLOAT
    ),
    'avgOrderValue', (
      SELECT COALESCE(AVG(amount), 0)::FLOAT
      FROM order_pricing op
      JOIN orders o ON o.id = op.order_id
      WHERE o.state IN ('PAYMENT_RECEIVED', 'IN_PRODUCTION', 'DELIVERED', 'COMPLETED')
        AND o.deleted_at IS NULL
    ),
    'recentOrders', (
      SELECT COUNT(*)::INTEGER
      FROM orders
      WHERE deleted_at IS NULL
        AND created_at >= NOW() - INTERVAL '7 days'
    ),
    'pendingQuotations', (
      SELECT COUNT(*)::INTEGER
      FROM quotations
      WHERE status = 'SUBMITTED'
    ),
    'activeProviders', (
      SELECT COUNT(DISTINCT provider_id)::INTEGER
      FROM orders
      WHERE deleted_at IS NULL
        AND state NOT IN ('COMPLETED', 'CANCELLED')
        AND provider_id IS NOT NULL
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- FOREIGN KEY indexes (required for efficient JOINs)
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_orders_client_id
  ON orders (client_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_provider_id
  ON orders (provider_id)
  WHERE deleted_at IS NULL
    AND provider_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quotations_order_id
  ON quotations (order_id);

CREATE INDEX IF NOT EXISTS idx_quotations_status
  ON quotations (status);

CREATE INDEX IF NOT EXISTS idx_orders_state_created
  ON orders (state, created_at DESC)
  WHERE deleted_at IS NULL;

-- Composite index for admin listing
CREATE INDEX IF NOT EXISTS idx_orders_deleted_created
  ON orders (created_at DESC)
  WHERE deleted_at IS NULL;

-- ═══════════════════════════════════════════════════════════
-- Enable trigram extension for search
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for search
CREATE INDEX IF NOT EXISTS idx_orders_title_trgm
  ON orders USING gin (delivery_address gin_trgm_ops);
