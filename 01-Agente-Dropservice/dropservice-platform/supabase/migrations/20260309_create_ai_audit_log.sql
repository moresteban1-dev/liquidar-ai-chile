-- ============================================================
-- Migration: Create ai_audit_log table
-- Purpose: Immutable log of all AI agent decisions
-- Policy: INSERT-ONLY (no UPDATE/DELETE via RLS)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_audit_log (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Agent identity
    agent_name      TEXT NOT NULL CHECK (agent_name IN ('BROKER', 'NEGOTIATOR', 'QA_SENTINEL')),
    action          TEXT NOT NULL CHECK (action IN ('AUTO_APPROVE', 'SUGGEST', 'ESCALATE')),

    -- Confidence metrics
    confidence_score SMALLINT NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
    reasoning        TEXT NOT NULL,

    -- Model metadata
    model            TEXT NOT NULL,
    prompt_version   TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL DEFAULT 0,

    -- Input/Output (JSONB for flexibility)
    input_data       JSONB NOT NULL DEFAULT '{}',
    output_data      JSONB NOT NULL DEFAULT '{}',

    -- Related entities
    quotation_id     UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    order_id         UUID REFERENCES public.orders(id) ON DELETE SET NULL,

    -- Human override tracking
    was_overridden   BOOLEAN NOT NULL DEFAULT false,
    overridden_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ─── Indexes ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_audit_quotation ON public.ai_audit_log(quotation_id)
    WHERE quotation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_audit_order ON public.ai_audit_log(order_id)
    WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_audit_agent_date ON public.ai_audit_log(agent_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_audit_action ON public.ai_audit_log(action);

-- ─── RLS: INSERT-ONLY for service role ────────────────────────

ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role can insert (backend only)
CREATE POLICY "ai_audit_insert_service" ON public.ai_audit_log
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Admins can read audit entries
CREATE POLICY "ai_audit_read_admin" ON public.ai_audit_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- NO UPDATE or DELETE policies → immutable by design

COMMENT ON TABLE public.ai_audit_log IS
  'Immutable audit log for all AI agent decisions. INSERT-ONLY by RLS policy.';
