-- ============================================
-- MIGRATION: Item Proposals
-- Allows providers to propose new items for inclusion
-- in the master catalog. Admin reviews and approves/rejects.
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================

CREATE TABLE IF NOT EXISTS public.item_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES auth.users(id),
    -- Proposed item details
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    item_type VARCHAR(20) NOT NULL DEFAULT 'SERVICE'
        CHECK (item_type IN ('SERVICE', 'EQUIPMENT', 'PERMIT', 'MIXED')),
    estimated_cost INTEGER NOT NULL CHECK (estimated_cost >= 0),
    unit_label VARCHAR(50) NOT NULL DEFAULT 'unidad',
    -- Review workflow
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    -- If approved, link to the created catalog item
    created_catalog_item_id VARCHAR(50),
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_item_proposals_provider
    ON public.item_proposals(provider_id);

CREATE INDEX IF NOT EXISTS idx_item_proposals_status
    ON public.item_proposals(status)
    WHERE status = 'PENDING';

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.item_proposals ENABLE ROW LEVEL SECURITY;

-- Providers can see their own proposals
CREATE POLICY "Providers see own proposals"
    ON public.item_proposals FOR SELECT
    USING (auth.uid() = provider_id);

-- Providers can insert proposals
CREATE POLICY "Providers can create proposals"
    ON public.item_proposals FOR INSERT
    WITH CHECK (auth.uid() = provider_id);

-- Admin role can see all (uses service_role key in API routes)
