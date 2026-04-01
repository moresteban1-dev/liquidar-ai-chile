-- ============================================================
-- Migration: Create quotation_items table (Normalize JSONB)
--
-- Purpose: Moves items from the `quotations.items` JSONB column
-- to a proper relational table with referential integrity.
--
-- Strategy: ADDITIVE — the JSONB column remains as backup.
-- New code writes to both places during transition period.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quotation_items (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quotation_id    UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Item data (mirrors QuotationItem domain entity)
    description     TEXT NOT NULL,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    category        TEXT NOT NULL DEFAULT 'SERVICE'
                    CHECK (category IN ('SERVICE', 'LOGISTICS', 'OTHER')),

    -- Ordering within the quotation
    sort_order      SMALLINT NOT NULL DEFAULT 0
);

-- ─── Indexes ──────────────────────────────────────────────────

-- Primary query: get all items for a quotation
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation
    ON public.quotation_items(quotation_id);

-- Filtered queries: by category
CREATE INDEX IF NOT EXISTS idx_quotation_items_category
    ON public.quotation_items(quotation_id, category);

-- ─── RLS ──────────────────────────────────────────────────────

ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- Service role (backend) can do anything
CREATE POLICY "quotation_items_service_all" ON public.quotation_items
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Clients can read items of their own quotations
CREATE POLICY "quotation_items_client_read" ON public.quotation_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quotations q
            WHERE q.id = quotation_items.quotation_id
            AND q.client_id = auth.uid()
        )
    );

-- Providers can read items of quotations assigned to them
CREATE POLICY "quotation_items_provider_read" ON public.quotation_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quotations q
            WHERE q.id = quotation_items.quotation_id
            AND q.assigned_provider_id = auth.uid()
        )
    );

-- Admins can read/write all items
CREATE POLICY "quotation_items_admin_all" ON public.quotation_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- ─── Migration Script: Copy existing JSONB items ──────────────
-- Run this ONCE after creating the table to backfill data.
-- The JSONB column is NOT dropped — it stays as a backup.

-- DO $$
-- DECLARE
--     rec RECORD;
--     item JSONB;
--     idx INTEGER;
-- BEGIN
--     FOR rec IN SELECT id, items FROM public.quotations WHERE items IS NOT NULL AND jsonb_array_length(items) > 0
--     LOOP
--         idx := 0;
--         FOR item IN SELECT * FROM jsonb_array_elements(rec.items)
--         LOOP
--             INSERT INTO public.quotation_items (quotation_id, description, quantity, category, sort_order)
--             VALUES (
--                 rec.id,
--                 COALESCE(item->>'description', item->>'name', 'Sin descripción'),
--                 COALESCE((item->>'quantity')::integer, 1),
--                 COALESCE(item->>'category', 'SERVICE'),
--                 idx
--             )
--             ON CONFLICT DO NOTHING;
--             idx := idx + 1;
--         END LOOP;
--     END LOOP;
-- END $$;

COMMENT ON TABLE public.quotation_items IS
  'Normalized quotation items. Replaces the JSONB `items` column in quotations. The JSONB column remains as backup during the transition period.';
