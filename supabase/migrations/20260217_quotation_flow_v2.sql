-- ============================================
-- MIGRATION: Quotation Flow V2
-- Alinea DB con el Informe Técnico de Cotizaciones
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================

-- ============================================
-- 1. TABLA: Items Solicitados por el Cliente
--    Lo que el CLIENTE pide (sin precios)
-- ============================================

CREATE TABLE IF NOT EXISTS public.quotation_requested_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quotation_requested_items ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_full_requested_items" ON public.quotation_requested_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

-- Provider: read-only for assigned quotations
CREATE POLICY "provider_read_requested_items" ON public.quotation_requested_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotations q
            WHERE q.id = quotation_id AND q.assigned_provider_id = auth.uid()
        )
    );

-- Client: read-only for own quotations
CREATE POLICY "client_read_requested_items" ON public.quotation_requested_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotations q
            WHERE q.id = quotation_id AND q.client_id = auth.uid()
        )
    );

-- ============================================
-- 2. TABLA: Items Cotizados por el Proveedor
--    El PROVEEDOR cotiza a precio NETO
--    categoria: 'SERVICIO' | 'LOGISTICA'
-- ============================================

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

ALTER TABLE public.quotation_provider_items ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_full_provider_items" ON public.quotation_provider_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

-- Provider: CRUD for assigned quotations
CREATE POLICY "provider_manage_own_items" ON public.quotation_provider_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quotations q
            WHERE q.id = quotation_id AND q.assigned_provider_id = auth.uid()
        )
    );

-- IMPORTANT: Client NEVER sees this table (no policy for CLIENTE role)

-- ============================================
-- 3. TABLA: Items para el Cliente
--    Reformulados por el ADMIN con comisión incluida
-- ============================================

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

ALTER TABLE public.quotation_client_items ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_full_client_items" ON public.quotation_client_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

-- Client: read-only for own quotations
CREATE POLICY "client_read_client_items" ON public.quotation_client_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotations q
            WHERE q.id = quotation_id AND q.client_id = auth.uid()
        )
    );

-- IMPORTANT: Provider NEVER sees client items (no policy for PROVEEDOR)

-- ============================================
-- 4. TABLA: Historial / Auditoría de Cambios
-- ============================================

CREATE TABLE IF NOT EXISTS public.quotation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    actor_id UUID NOT NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('CLIENTE', 'ADMIN', 'PROVEEDOR', 'SISTEMA')),
    comment TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quotation_history ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_full_history" ON public.quotation_history
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

-- Client: partial (own quotation history)
CREATE POLICY "client_read_history" ON public.quotation_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotations q
            WHERE q.id = quotation_id AND q.client_id = auth.uid()
        )
    );

-- Provider: partial (assigned quotation history)
CREATE POLICY "provider_read_history" ON public.quotation_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotations q
            WHERE q.id = quotation_id AND q.assigned_provider_id = auth.uid()
        )
    );

-- ============================================
-- 5. COLUMNAS NUEVAS EN quotations
-- ============================================

-- Datos del cliente
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS client_rut TEXT;

-- Logística extra
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS event_address TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS event_end_time TEXT;

-- Notas y rechazo
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS provider_notes TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS technical_visit BOOLEAN DEFAULT FALSE;

-- Financiero: Desglose de comisión
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS subtotal_services_provider BIGINT DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS subtotal_logistics_provider BIGINT DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS total_provider_net BIGINT DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS commission_services_net BIGINT DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS commission_logistics_net BIGINT DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS total_commission_net BIGINT DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS commission_method TEXT DEFAULT 'PORCENTAJE'
    CHECK (commission_method IN ('MONTO_FIJO', 'PORCENTAJE', 'PORCENTAJE_CATEGORIA', 'MIXTO'));
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS total_net BIGINT DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS total_iva BIGINT DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS total_with_iva BIGINT DEFAULT 0;

-- Timestamps por fase
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS provider_quoted_at TIMESTAMPTZ;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS sent_to_client_at TIMESTAMPTZ;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ;

-- ============================================
-- 6. INDEXES para performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_requested_items_quotation ON public.quotation_requested_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_provider_items_quotation ON public.quotation_provider_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_client_items_quotation ON public.quotation_client_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_history_quotation ON public.quotation_history(quotation_id);
CREATE INDEX IF NOT EXISTS idx_history_actor ON public.quotation_history(actor_id);

-- ============================================
-- 7. REALTIME para las nuevas tablas
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.quotation_history;
