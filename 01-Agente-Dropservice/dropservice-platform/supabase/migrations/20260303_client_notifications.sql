-- ============================================
-- MIGRATION: Client Notifications
-- Persists notifications for the client dashboard.
-- Supports quotation status changes, payment reminders,
-- event reminders, and system messages.
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Recipient
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'QUOTATION_STATUS',
        'PAYMENT_REMINDER',
        'EVENT_REMINDER',
        'DOCUMENT_READY',
        'MESSAGE',
        'SYSTEM'
    )),

    -- Reference (polymorphic link)
    reference_type VARCHAR(50),
    reference_id UUID,

    -- Read state
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    -- CTA
    action_url VARCHAR(500),
    action_label VARCHAR(100),

    -- Display
    icon VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

-- Primary read path: user's unread notifications
CREATE INDEX IF NOT EXISTS idx_client_notifications_unread
    ON public.client_notifications(user_id, is_read)
    WHERE is_read = false;

-- Secondary: user's full history
CREATE INDEX IF NOT EXISTS idx_client_notifications_user
    ON public.client_notifications(user_id, created_at DESC);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
    ON public.client_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON public.client_notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
