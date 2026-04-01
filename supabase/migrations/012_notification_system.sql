-- supabase/migrations/012_notification_system.sql
-- ═══════════════════════════════════════════════════════════
-- SPRINT 3 DAY 6: Notification System Tables
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- TABLE: notification_log
-- Tracks every notification attempt across all channels
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id        UUID REFERENCES event_outbox(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL,
  channel         TEXT NOT NULL CHECK (channel IN ('email', 'webhook', 'in_app')),
  recipient_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT,
  template_id     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  provider        TEXT,
  error           TEXT,
  metadata        JSONB DEFAULT '{}',
  duration_ms     INTEGER,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_log_event_id
  ON notification_log (event_id);

CREATE INDEX IF NOT EXISTS idx_notif_log_recipient
  ON notification_log (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notif_log_status_pending
  ON notification_log (status)
  WHERE status = 'pending';

-- ───────────────────────────────────────────────────────────
-- TABLE: webhooks
-- Registered webhook endpoints for event subscriptions
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhooks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url             TEXT NOT NULL,
  description     TEXT,
  events          TEXT[] NOT NULL DEFAULT '{}',
  secret          TEXT NOT NULL,
  headers         JSONB DEFAULT '{}',
  retry_policy    JSONB NOT NULL DEFAULT '{
    "maxRetries": 3,
    "backoffMs": 1000,
    "backoffMultiplier": 2
  }',
  active          BOOLEAN NOT NULL DEFAULT true,
  failure_count   INTEGER NOT NULL DEFAULT 0,
  last_triggered  TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_active_events
  ON webhooks USING GIN (events)
  WHERE active = true;

-- ───────────────────────────────────────────────────────────
-- TABLE: webhook_deliveries
-- Tracks every webhook delivery attempt with retry state
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id      UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  status_code     INTEGER,
  response_body   TEXT,
  attempts        INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL DEFAULT 4,
  error           TEXT,
  next_retry_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wd_pending_retrying
  ON webhook_deliveries (status)
  WHERE status IN ('pending', 'retrying');

-- ───────────────────────────────────────────────────────────
-- RLS Policies
-- ───────────────────────────────────────────────────────────

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- notification_log: admin full access, users see own
DO $$ BEGIN
  CREATE POLICY "admin_full_notification_log" ON notification_log
    FOR ALL USING ( (auth.jwt() ->> 'role') = 'admin' );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "users_own_notifications" ON notification_log
    FOR SELECT USING ( recipient_id = auth.uid() );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
