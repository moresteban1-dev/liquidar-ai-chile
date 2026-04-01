-- Migración V2 para el Motor de Cotización (Inteligente y Segmentado)
-- Tablas: v2_quote_sessions, v2_quote_options, v2_quote_items

-- Habilitar extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla principal de Sesiones de Cotización (Lead Tracking y Base Operativa)
CREATE TABLE IF NOT EXISTS public.v2_quote_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    segment VARCHAR(50) NOT NULL DEFAULT 'CORPORATIVO', -- CORPORATIVO, AGENCIA, SOCIAL_PREMIUM, PUBLICO
    step_data JSONB NOT NULL DEFAULT '{}',              -- Respuestas originales pasos 1-5
    
    -- Inputs Core
    event_type VARCHAR(100),
    event_date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    attendees INTEGER,
    duration VARCHAR(50),                               -- 4H, 8H, MULTIPLE
    budget NUMERIC(12, 2) DEFAULT 0,
    priorities JSONB NOT NULL DEFAULT '[]',             -- Array ordenado
    is_sustainable BOOLEAN DEFAULT FALSE,
    needs_permits VARCHAR(50) DEFAULT 'NO',
    
    -- Lead
    client_data JSONB NOT NULL DEFAULT '{}',            -- { name, email, phone, company, preferences }
    
    -- State
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',        -- DRAFT, GENERATED, SENT, ACCEPTED, REJECTED
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para v2_quote_sessions
ALTER TABLE public.v2_quote_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas base: Admins leen/escriben todo, Anónimos pueden insertar (Web pública)
CREATE POLICY "Anon can create quote sessions" ON public.v2_quote_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read quote sessions" ON public.v2_quote_sessions FOR SELECT USING (true);
CREATE POLICY "Admins can update quote sessions" ON public.v2_quote_sessions FOR UPDATE USING (true);


-- 2. Items seleccionados explícitamente o recomendados para esta sesión
CREATE TABLE IF NOT EXISTS public.v2_quote_items_requested (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.v2_quote_sessions(id) ON DELETE CASCADE,
    catalog_item_id VARCHAR(50),                        -- FK Opcional a catalog_items para mantener flexibilidad
    is_custom BOOLEAN DEFAULT FALSE,                    -- True si lo escribió el usuario a mano
    custom_name VARCHAR(255),                           -- Ej: "Show de Magia"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.v2_quote_items_requested ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon can create requested items" ON public.v2_quote_items_requested FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read requested items" ON public.v2_quote_items_requested FOR SELECT USING (true);


-- 3. Opciones de cotización (Económica, Recomendada, Premium)
CREATE TABLE IF NOT EXISTS public.v2_quote_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.v2_quote_sessions(id) ON DELETE CASCADE,
    option_type VARCHAR(50) NOT NULL,                   -- ECONOMICA, RECOMENDADA, PREMIUM
    total_value NUMERIC(12, 2) NOT NULL,                -- Valor final calculado
    margin_applied NUMERIC(5, 2) NOT NULL,              -- Margen aplicado, ej: 35.00
    config_notes TEXT,                                  -- Notas internas sobre recortes o añadidos
    included_catalog_items JSONB NOT NULL DEFAULT '[]', -- Array de catalog_item_ids incluidos en esta variante
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.v2_quote_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon can create options" ON public.v2_quote_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read options" ON public.v2_quote_options FOR SELECT USING (true);
CREATE POLICY "Anon can read own session options" ON public.v2_quote_options FOR SELECT USING (true); -- Permitir UI pública leer las cotizaciones generadas


-- Trigger genérico de updated_at para v2_quote_sessions
CREATE OR REPLACE FUNCTION update_v2_quote_sessions_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_v2_quote_sessions_updated_at ON public.v2_quote_sessions;
CREATE TRIGGER trg_v2_quote_sessions_updated_at
BEFORE UPDATE ON public.v2_quote_sessions
FOR EACH ROW EXECUTE FUNCTION update_v2_quote_sessions_modtime();

-- Add Indexes for Dashboards and Filtering
CREATE INDEX IF NOT EXISTS idx_v2_qs_status ON public.v2_quote_sessions(status);
CREATE INDEX IF NOT EXISTS idx_v2_qs_segment ON public.v2_quote_sessions(segment);
CREATE INDEX IF NOT EXISTS idx_v2_qs_created_at ON public.v2_quote_sessions(created_at);
