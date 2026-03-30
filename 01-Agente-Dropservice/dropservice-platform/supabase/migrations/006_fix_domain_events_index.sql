-- BUG-005: Optimize unprocessed events query
-- Evita full table scans en la tabla de eventos agregando un índice parcial.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_domain_events_unprocessed 
ON domain_events(created_at ASC) 
WHERE processed = FALSE;

COMMENT ON INDEX idx_domain_events_unprocessed IS 'Optimizes event outbox polling by indexing only unprocessed events.';
