-- ============================================
-- MIGRATION: Client Feedback / Ratings
-- Allows clients to rate and review completed events.
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quotation_id UUID NOT NULL,

    -- Ratings (1-5)
    overall_rating SMALLINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    quality_rating SMALLINT CHECK (quality_rating BETWEEN 1 AND 5),
    punctuality_rating SMALLINT CHECK (punctuality_rating BETWEEN 1 AND 5),
    communication_rating SMALLINT CHECK (communication_rating BETWEEN 1 AND 5),

    -- Text
    comment TEXT,
    would_recommend BOOLEAN DEFAULT true,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate feedback per quotation
    CONSTRAINT unique_feedback_per_quotation UNIQUE (user_id, quotation_id)
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_client_feedback_user
    ON public.client_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_client_feedback_quotation
    ON public.client_feedback(quotation_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own feedback"
    ON public.client_feedback FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
    ON public.client_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);
