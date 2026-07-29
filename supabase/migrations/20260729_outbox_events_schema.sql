-- =============================================================================
-- Liquidar Platform Chile — Supabase Migration
-- Migration: 20260729_outbox_events_schema
-- Description: Creates outbox_events table for transactional Domain Events
--              dispatching (DDD Outbox Pattern) and Realtime notification trigger.
-- =============================================================================

CREATE TABLE IF NOT EXISTS outbox_events (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id     TEXT NOT NULL UNIQUE,
  event_name   TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  payload      JSONB NOT NULL,
  occurred_on  TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed    BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_reason TEXT,
  retry_count  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for high-performance outbox polling worker
CREATE INDEX IF NOT EXISTS idx_outbox_unprocessed ON outbox_events(processed, occurred_on) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_outbox_aggregate ON outbox_events(aggregate_id, event_name);

-- Enable Supabase Realtime for outbox_events
ALTER PUBLICATION supabase_realtime ADD TABLE outbox_events;
