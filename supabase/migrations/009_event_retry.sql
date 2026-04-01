-- Function to increment retry count
CREATE OR REPLACE FUNCTION increment_retry_count(
  event_id UUID,
  error_msg TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE domain_events
  SET retry_count = retry_count + 1,
      error_message = error_msg,
      updated_at = NOW()
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- Index for event processing queries
CREATE INDEX IF NOT EXISTS idx_domain_events_processing
ON domain_events(processed, retry_count, occurred_at ASC)
WHERE processed = FALSE AND retry_count < 3;
