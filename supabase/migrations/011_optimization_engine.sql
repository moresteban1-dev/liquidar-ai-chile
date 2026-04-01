-- ═══════════════════════════════════════════════════════
-- RPC: get_db_performance_summary
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_db_performance_summary()
RETURNS TABLE(
  metric_name TEXT,
  metric_value TEXT,
  status TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Cache hit ratio
  SELECT 
    'cache_hit_ratio' AS metric_name,
    ROUND(
      (sum(heap_blks_hit)::FLOAT / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100)::NUMERIC, 
      2
    )::TEXT AS metric_value,
    CASE 
      WHEN (sum(heap_blks_hit)::FLOAT / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100) > 99 
      THEN 'excellent'
      WHEN (sum(heap_blks_hit)::FLOAT / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100) > 95 
      THEN 'good'
      ELSE 'warning'
    END AS status
  FROM pg_statio_user_tables

  UNION ALL

  -- Connection count
  SELECT
    'active_connections' AS metric_name,
    count(*)::TEXT AS metric_value,
    CASE 
      WHEN count(*) > 80 THEN 'critical'
      WHEN count(*) > 50 THEN 'warning'
      ELSE 'good'
    END AS status
  FROM pg_stat_activity
  WHERE state = 'active'
  GROUP BY state;
$$;

-- ═══════════════════════════════════════════════════════
-- TABLE: optimization_scans
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS optimization_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  score INTEGER NOT NULL,
  total_findings INTEGER NOT NULL,
  report JSONB NOT NULL,
  duration_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE optimization_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_only_optimization" ON optimization_scans
  FOR ALL USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- ═══════════════════════════════════════════════════════
-- TABLE: event_outbox
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS event_outbox (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_id TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_outbox_status_pending ON event_outbox (status) WHERE status = 'pending';

ALTER TABLE event_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_only_outbox" ON event_outbox
  FOR ALL USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );
