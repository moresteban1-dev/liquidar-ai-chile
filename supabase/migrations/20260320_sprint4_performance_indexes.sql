
-- Sprint 4: Performance & Optimization Migration [NASA-Grade]
-- Target: Optimize multi-join queries and batch loading for Quotations and Provider Bids.

-- 1. Quotation Items (Optimizing RFP item retrieval)
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_catalog_item_id ON public.quotation_items(catalog_item_id);

-- 2. Provider Bids (Optimizing matching and comparison)
CREATE INDEX IF NOT EXISTS idx_provider_bids_quotation_id ON public.provider_bids(quotation_id);
CREATE INDEX IF NOT EXISTS idx_provider_bids_provider_id ON public.provider_bids(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_bids_status ON public.provider_bids(status);

-- 3. Quotation History & Audit (Optimizing forensic lookups)
CREATE INDEX IF NOT EXISTS idx_quotation_history_quotation_id ON public.quotation_history(quotation_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_quotation_id ON public.ai_audit_log(quotation_id);

-- 4. Provider Inventory (Optimizing the Auto-Match engine)
CREATE INDEX IF NOT EXISTS idx_provider_inventory_catalog_item_id ON public.provider_inventory(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_provider_inventory_provider_id ON public.provider_inventory(provider_id);
