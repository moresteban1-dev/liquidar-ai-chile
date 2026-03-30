-- ============================================
-- MIGRATION: Add catalog_item_id to quotation_provider_items
-- Enables the matching engine to link provider-quoted items
-- back to the master catalog for automatic provider suggestions.
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================

-- 1. Add nullable FK column (nullable because providers may quote
--    free-text items that don't exist in the catalog)
ALTER TABLE public.quotation_provider_items
    ADD COLUMN IF NOT EXISTS catalog_item_id VARCHAR(50);

-- 2. Index for matching queries that filter by catalog_item_id
CREATE INDEX IF NOT EXISTS idx_provider_items_catalog
    ON public.quotation_provider_items(catalog_item_id)
    WHERE catalog_item_id IS NOT NULL;

-- 3. Composite index for matching API: quotation + catalog item
CREATE INDEX IF NOT EXISTS idx_provider_items_quotation_catalog
    ON public.quotation_provider_items(quotation_id, catalog_item_id);
