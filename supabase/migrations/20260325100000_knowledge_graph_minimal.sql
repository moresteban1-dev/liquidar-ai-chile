-- ============================================================================
-- SPRINT 5.1: KNOWLEDGE GRAPH - MINIMAL SCHEMA
-- ============================================================================

-- TABLA 1: Event Types (Simplificada)
CREATE TABLE IF NOT EXISTS public.event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    base_category VARCHAR(50), -- 'CORPORATE', 'SOCIAL', 'CULTURAL'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA 2: Service Nodes (Simplificada)
CREATE TABLE IF NOT EXISTS public.service_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    node_type VARCHAR(30) NOT NULL CHECK (node_type IN (
        'EQUIPMENT',
        'STAFF',
        'INFRASTRUCTURE',
        'SERVICE'
    )),
    is_essential BOOLEAN DEFAULT FALSE, -- Requerido siempre?
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices básicos
CREATE INDEX IF NOT EXISTS idx_event_types_category ON public.event_types(base_category) 
    WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_service_nodes_type ON public.service_nodes(node_type) 
    WHERE is_active = TRUE;

-- RLS (mismo patrón que V2)
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_nodes ENABLE ROW LEVEL SECURITY;

-- Evitar duplicados en políticas si ya existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active event types') THEN
        CREATE POLICY "Public can view active event types" ON public.event_types FOR SELECT USING (is_active = TRUE);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active service nodes') THEN
        CREATE POLICY "Public can view active service nodes" ON public.service_nodes FOR SELECT USING (is_active = TRUE);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage event types') THEN
        CREATE POLICY "Admins can manage event types" ON public.event_types FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage service nodes') THEN
        CREATE POLICY "Admins can manage service nodes" ON public.service_nodes FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));
    END IF;
END $$;

-- SEED MÍNIMO (5 event types, 10 nodes)
INSERT INTO public.event_types (code, name, description, base_category) VALUES
    ('CORP_WORKSHOP', 'Corporate Workshop', 'Taller empresarial', 'CORPORATE'),
    ('CORP_CONFERENCE', 'Conference', 'Conferencia profesional', 'CORPORATE'),
    ('WEDDING', 'Wedding', 'Boda', 'SOCIAL'),
    ('BIRTHDAY', 'Birthday Party', 'Fiesta de cumpleaños', 'SOCIAL'),
    ('CONCERT', 'Concert', 'Concierto', 'CULTURAL')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.service_nodes (code, name, description, node_type, is_essential) VALUES
    ('PROJECTOR', 'Video Projector', 'Proyector Full HD', 'EQUIPMENT', FALSE),
    ('SOUND_BASIC', 'Basic Sound System', 'Sistema de audio básico', 'EQUIPMENT', TRUE),
    ('MICROPHONE', 'Wireless Microphone', 'Micrófono inalámbrico', 'EQUIPMENT', TRUE),
    ('CHAIRS', 'Standard Chairs', 'Sillas estándar', 'EQUIPMENT', TRUE),
    ('TABLES', 'Round Tables', 'Mesas redondas', 'EQUIPMENT', FALSE),
    ('SCREEN', 'Projection Screen', 'Pantalla de proyección', 'EQUIPMENT', FALSE),
    ('TECHNICIAN', 'AV Technician', 'Técnico audiovisual', 'STAFF', TRUE),
    ('CATERING', 'Catering Service', 'Servicio de catering', 'SERVICE', FALSE),
    ('REGISTRATION', 'Registration Desk', 'Mesa de registro', 'INFRASTRUCTURE', FALSE),
    ('WIFI', 'WiFi Network', 'Red WiFi', 'SERVICE', FALSE)
ON CONFLICT (code) DO NOTHING;
