-- ============================================
-- DOMAIN EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  aggregate_id UUID NOT NULL,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Metadata
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Índices
CREATE INDEX idx_domain_events_type ON domain_events(event_type);
CREATE INDEX idx_domain_events_aggregate ON domain_events(aggregate_id);
CREATE INDEX idx_domain_events_processed ON domain_events(processed, created_at);
CREATE INDEX idx_domain_events_occurred ON domain_events(occurred_at DESC);

-- Función para marcar evento como procesado
CREATE OR REPLACE FUNCTION mark_event_processed(event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE domain_events
  SET processed = TRUE,
      processed_at = NOW()
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- Vista de eventos no procesados
CREATE OR REPLACE VIEW unprocessed_events 
WITH (security_invoker = true)
AS
SELECT *
FROM domain_events
WHERE processed = FALSE
ORDER BY occurred_at ASC;

-- Comentarios
COMMENT ON TABLE domain_events IS 'Domain events para procesamiento asíncrono';
COMMENT ON COLUMN domain_events.payload IS 'JSON completo del evento';
COMMENT ON COLUMN domain_events.processed IS 'Indica si el evento ya fue procesado';
