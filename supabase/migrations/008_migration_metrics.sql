-- ============================================
-- MIGRATION METRICS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS migration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(200) NOT NULL,
  version VARCHAR(5) NOT NULL,    -- 'v1' or 'v2'
  status INTEGER NOT NULL,
  duration DECIMAL(10, 2) NOT NULL,
  user_id VARCHAR(100),
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_version CHECK (version IN ('v1', 'v2')),
  CONSTRAINT positive_duration CHECK (duration >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_migration_metrics_endpoint ON migration_metrics(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_migration_metrics_version ON migration_metrics(endpoint, version, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_migration_metrics_recent ON migration_metrics(created_at DESC)
  WHERE created_at > NOW() - INTERVAL '24 hours';

-- Cleanup: auto-delete metrics older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_migration_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM migration_metrics
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Summary view
CREATE OR REPLACE VIEW migration_summary 
WITH (security_invoker = true)
AS
SELECT
  endpoint,
  version,
  COUNT(*) as total_requests,
  ROUND(AVG(duration)::numeric, 2) as avg_duration,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration)::numeric, 2) as p50,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration)::numeric, 2) as p95,
  ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration)::numeric, 2) as p99,
  ROUND(
    (COUNT(*) FILTER (WHERE status >= 400)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as error_rate,
  MIN(created_at) as first_request,
  MAX(created_at) as last_request
FROM migration_metrics
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY endpoint, version
ORDER BY endpoint, version;

COMMENT ON TABLE migration_metrics IS 'Métricas de comparación v1 vs v2 durante migración';
COMMENT ON VIEW migration_summary IS 'Resumen de métricas de migración por endpoint y versión';
