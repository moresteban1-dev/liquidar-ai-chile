-- ============================================
-- MIGRATION: Quotation Flow V2 (SAFE EXECUTION)
-- Alinea DB con el Informe Técnico de Cotizaciones
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================

-- 1. TABLA: Items Solicitados por el Cliente
CREATE TABLE IF NOT EXISTS public.quotation_requested_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE public.quotation_requested_items ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Policies for requested items
DROP POLICY IF EXISTS "admin_full_requested_items" ON public.quotation_requested_items;
CREATE POLICY "admin_full_requested_items" ON public.quotation_requested_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

DROP POLICY IF EXISTS "provider_read_requested_items" ON public.quotation_requested_items;
CREATE POLICY "provider_read_requested_items" ON public.quotation_requested_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotations q
            WHERE q.id = quotation_id AND q.assigned_provider_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "client_read_requested_items" ON public.quotation_requested_items;
CREATE POLICY "client_read_requested_items" ON public.quotation_requested_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotations q
            WHERE q.id = quotation_id AND q.client_id = auth.uid()
        )
    );

-- 2. TABLA: Items Cotizados por el Proveedor
CREATE TABLE IF NOT EXISTS public.quotation_provider_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('SERVICIO', 'LOGISTICA')),
    concept TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_net BIGINT NOT NULL,
    total_price_net BIGINT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE public.quotation_provider_items ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Policies for provider items
DROP POLICY IF EXISTS "admin_full_provider_items" ON public.quotation_provider_items;
CREATE POLICY "admin_full_provider_items" ON public.quotation_provider_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

DROP POLICY IF EXISTS "provider_manage_own_items" ON public.quotation_provider_items;
CREATE POLICY "provider_manage_own_items" ON public.quotation_provider_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quotations q
            WHERE q.id = quotation_id AND q.assigned_provider_id = auth.uid()
        )
    );

-- 3. TABLA: Items para el Cliente
CREATE TABLE IF NOT EXISTS public.quotation_client_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_net BIGINT NOT NULL,
    total_price_net BIGINT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE public.quotation_client_items ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Policies for client items
DROP POLICY IF EXISTS "admin_full_client_items" ON public.quotation_client_items;
CREATE POLICY "admin_full_client_items" ON public.quotation_client_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

DROP POLICY IF EXISTS "client_read_client_items" ON public.quotation_client_items;
CREATE POLICY "client_read_client_items" ON public.quotation_client_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotations q
            WHERE q.id = quotation_id AND q.client_id = auth.uid()
        )
    );

-- 4. COLUMNAS NUEVAS EN quotations (Resumen y Timestamps)
-- Se usa DO block para que no falle si las columnas ya existen
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.quotations ADD COLUMN client_rut TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.quotations ADD COLUMN event_address TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.quotations ADD COLUMN provider_notes TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.quotations ADD COLUMN total_provider_net BIGINT DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.quotations ADD COLUMN total_commission_net BIGINT DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.quotations ADD COLUMN total_net BIGINT DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.quotations ADD COLUMN total_iva BIGINT DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.quotations ADD COLUMN total_with_iva BIGINT DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.quotations ADD COLUMN provider_quoted_at TIMESTAMPTZ;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
END $$;
