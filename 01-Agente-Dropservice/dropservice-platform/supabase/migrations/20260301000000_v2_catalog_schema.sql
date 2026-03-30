-- Migration V2: Smart Catalog & Pricing Engine Schema
-- This script creates the foundational tables for Phase 1 of the new unified catalog strategy.
-- It is designed to be fully backward compatible with the V1 "services" table.

-- ============================================================================
-- 1. ENUMS (Optional but good for strict validation, or we can just use VARCHAR check constraints)
-- For maximum flexibility and iterative evolution, we'll use VARCHAR with CHECK constraints initially.
-- ============================================================================

-- ============================================================================
-- 2. catalog_categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.catalog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.catalog_categories(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    level INT NOT NULL CHECK (level IN (1, 2, 3)),
    path TEXT[] NOT NULL DEFAULT '{}',
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('SERVICE', 'EQUIPMENT', 'PERMIT', 'MIXED')),
    icon VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for searching and hierarchy traversing
CREATE INDEX IF NOT EXISTS idx_catalog_categories_parent_id ON public.catalog_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_slug ON public.catalog_categories(slug);

-- ============================================================================
-- 3. catalog_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.catalog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.catalog_categories(id) ON DELETE RESTRICT,
    legacy_service_id UUID REFERENCES public.services(id) ON DELETE SET NULL, -- Bridges V1 to V2
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('SERVICE', 'EQUIPMENT', 'PERMIT')),
    code VARCHAR(50) UNIQUE NOT NULL,
    sku VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description VARCHAR(500),
    full_description TEXT,
    technical_specs JSONB DEFAULT '{}'::jsonb,
    
    -- Pricing
    pricing_model VARCHAR(50) NOT NULL CHECK (pricing_model IN ('FIXED', 'PER_UNIT', 'PER_HOUR', 'PER_DAY', 'PER_PERSON', 'PER_SQM', 'PER_LM', 'CUSTOM')),
    unit_label VARCHAR(50) NOT NULL,
    price_reference_min INTEGER,
    price_reference_max INTEGER,
    price_suggested INTEGER,
    default_margin_percent DECIMAL(5,2),
    min_margin_percent DECIMAL(5,2),
    
    -- Media
    images JSONB DEFAULT '[]'::jsonb,
    videos JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Search & Discovery
    tags TEXT[] DEFAULT '{}',
    search_vector TSVECTOR,
    
    -- Control
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
    is_featured BOOLEAN DEFAULT false,
    is_popular BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Search and performance indexes
CREATE INDEX IF NOT EXISTS idx_catalog_items_category_id ON public.catalog_items(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_slug ON public.catalog_items(slug);
CREATE INDEX IF NOT EXISTS idx_catalog_items_search_vector ON public.catalog_items USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_catalog_items_tags ON public.catalog_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_catalog_items_status ON public.catalog_items(status);

-- Automatic TSVECTOR trigger for search optimization
CREATE OR REPLACE FUNCTION catalog_items_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  new.search_vector :=
    setweight(to_tsvector('spanish', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(new.short_description, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(array_to_string(new.tags, ' '), '')), 'C');
  return new;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsvectorupdate ON public.catalog_items;
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION catalog_items_search_vector_trigger();

-- ============================================================================
-- 4. event_templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.event_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- CORPORATIVO, SOCIAL, FESTIVAL...
    event_subtype VARCHAR(50), 
    attendees_min INT NOT NULL DEFAULT 0,
    attendees_max INT NOT NULL DEFAULT 100000,
    tier VARCHAR(50) NOT NULL CHECK (tier IN ('ECONOMICA', 'ESTANDAR', 'PREMIUM', 'CUSTOM')),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 5. event_template_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.event_template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.event_templates(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
    quantity_base INT DEFAULT 1,
    quantity_formula VARCHAR(255), -- Support dynamic JS/eval expressions like 'CEIL(ATTENDEES / 50)'
    is_essential BOOLEAN DEFAULT true,
    is_replaceable BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(template_id, item_id)
);

-- ============================================================================
-- 6. provider_catalog_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.provider_catalog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
    cost_per_unit INTEGER, -- net cost specific to provider
    is_available BOOLEAN DEFAULT true,
    available_quantity INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(provider_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_catalog_items_provider ON public.provider_catalog_items(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_catalog_items_item ON public.provider_catalog_items(item_id);

-- ============================================================================
-- 7. platform_config
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.platform_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 8. catalog_price_history
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.catalog_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
    price_reference_min INTEGER,
    price_reference_max INTEGER,
    price_suggested INTEGER,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    effective_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- RLS (Row Level Security) Configuration
-- ============================================================================

-- Active RLS on all tables
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_price_history ENABLE ROW LEVEL SECURITY;

-- Catalog Categories policies
CREATE POLICY "Public can view active catalog categories"
  ON public.catalog_categories FOR SELECT
  USING (status = 'ACTIVE' OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));

CREATE POLICY "Admins can manage catalog categories"
  ON public.catalog_categories FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));

-- Catalog Items policies
CREATE POLICY "Public can view active catalog items"
  ON public.catalog_items FOR SELECT
  USING (status = 'ACTIVE' OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));

CREATE POLICY "Admins can manage catalog items"
  ON public.catalog_items FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));

-- Event Templates policies
CREATE POLICY "Anyone can view active event templates"
  ON public.event_templates FOR SELECT
  USING (status = 'ACTIVE' OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));

CREATE POLICY "Admins can manage event templates"
  ON public.event_templates FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));

-- Event Template Items policies
CREATE POLICY "Anyone can view items from active templates"
  ON public.event_template_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.event_templates WHERE id = template_id AND (status = 'ACTIVE' OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'))));

CREATE POLICY "Admins can manage event template items"
  ON public.event_template_items FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));

-- Provider Catalog policies
CREATE POLICY "Providers can view/manage their own inventory"
  ON public.provider_catalog_items FOR ALL
  USING (auth.uid() = provider_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));

-- Platform Config policies (Public read, admin write)
-- Some configs might be public (like categories), others private. For simplicity, read ALL to authenticated users, or we can restrict.
-- Actually public config like IVA and margins is heavily used. Read all.
CREATE POLICY "Anyone can view platform config"
  ON public.platform_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage platform config"
  ON public.platform_config FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));

-- Catalog Price History policies
CREATE POLICY "Admins can view and manage price history"
  ON public.catalog_price_history FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));
