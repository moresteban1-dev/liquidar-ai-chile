-- Omnidiagnostic Optimization: Secondary Indexes for V2 Schema
-- Target: Optimize Catalog V2 and Quote Sessions V2 lookups.

-- 1. Catalog V2 Optimization
-- Categories often filtered by level and status
CREATE INDEX IF NOT EXISTS idx_catalog_categories_level_status ON public.catalog_categories(level, status);
-- Items often filtered by item_type and status
CREATE INDEX IF NOT EXISTS idx_catalog_items_type_status ON public.catalog_items(item_type, status);

-- 2. Quote Sessions V2 Optimization
-- Sessions often looked up by client data (email) inside JSONB
CREATE INDEX IF NOT EXISTS idx_v2_qs_client_email ON public.v2_quote_sessions ((client_data->>'email'));
-- Sessions often filtered by both segment and status
CREATE INDEX IF NOT EXISTS idx_v2_qs_segment_status ON public.v2_quote_sessions(segment, status);

-- 3. Provider Catalog Optimization
-- Joins between items and providers
CREATE INDEX IF NOT EXISTS idx_provider_catalog_items_composite ON public.provider_catalog_items(provider_id, item_id) WHERE is_available = true;
