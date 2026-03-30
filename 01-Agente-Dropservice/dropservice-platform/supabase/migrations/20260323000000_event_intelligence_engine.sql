-- =================================================================================
-- Migration: Event Configuration Intelligence Engine (Knowledge Graph)
-- Descripción: Tablas base para el motor de inferencia topológico 
-- Autor: Antigravity Prime
-- Fecha: 2026-03-23
-- =================================================================================

-- 1. event_types (Tipos base de eventos: Corporativo, Social, Lanzamiento)
CREATE TABLE IF NOT EXISTS public.event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_category VARCHAR(50) NOT NULL CHECK (base_category IN ('CORPORATIVE', 'SOCIAL', 'FESTIVAL', 'CUSTOM')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. service_nodes (Nodos abstractos de servicios/productos)
CREATE TABLE IF NOT EXISTS public.service_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,       -- ej: 'PA_SYSTEM_500'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    node_type VARCHAR(50) NOT NULL CHECK (node_type IN ('EQUIPMENT', 'STAFF', 'SERVICE', 'DELIVERABLE')),
    catalog_category_id UUID REFERENCES public.catalog_categories(id), -- Conector al catálogo duro
    is_essential BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. event_type_node_mappings (Relación de 1er Nivel: Qué nodos base usa un tipo de evento)
CREATE TABLE IF NOT EXISTS public.event_type_node_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type_id UUID NOT NULL REFERENCES public.event_types(id) ON DELETE CASCADE,
    service_node_id UUID NOT NULL REFERENCES public.service_nodes(id) ON DELETE CASCADE,
    priority INT DEFAULT 1, -- 1=Obligatorio, 2=Recomendado, 3=Opcional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_type_id, service_node_id)
);

-- 4. service_dependencies (Edges/Aristas: Si pido X, recomiendo Y)
CREATE TABLE IF NOT EXISTS public.service_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node_id UUID NOT NULL REFERENCES public.service_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES public.service_nodes(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) NOT NULL CHECK (dependency_type IN ('REQUIRES', 'RECOMMENDS', 'INCOMPATIBLE_WITH')),
    reasoning TEXT, -- Por qué la IA/Regla decidió esto
    confidence_score DECIMAL(3,2) DEFAULT 1.00, -- Sirve para el motor ML posteriormente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(source_node_id, target_node_id, dependency_type)
);

-- 5. scaling_rules (Ecuaciones/Reglas para multiplicar nodos basado en aforo)
CREATE TABLE IF NOT EXISTS public.scaling_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_node_id UUID NOT NULL REFERENCES public.service_nodes(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('LINEAR', 'STEP', 'FIXED', 'LOGARITHMIC')),
    parameter_target VARCHAR(50) NOT NULL DEFAULT 'ATTENDEES', -- 'ATTENDEES', 'SQUARE_METERS', 'HOURS'
    base_quantity INT DEFAULT 1,
    divisor INT DEFAULT 1, -- Ejemplo: Divide Attendees por 50 para Baños
    max_quantity INT,      -- Cap
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. inference_history / configuration_sessions (Donde el Wizard guarda borradores)
CREATE TABLE IF NOT EXISTS public.event_configuration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type_id UUID REFERENCES public.event_types(id),
    base_parameters JSONB NOT NULL DEFAULT '{}'::jsonb, -- { attendees: 500, venue_sqm: 1000 }
    inferred_nodes JSONB DEFAULT '[]'::jsonb,           -- El grafo resuelto
    status VARCHAR(50) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'CONVERTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================================================
-- INDEXES PARA PERFORMANCE (Topological Sort optimización)
-- =================================================================================
CREATE INDEX idx_service_dependencies_source ON public.service_dependencies(source_node_id);
CREATE INDEX idx_service_dependencies_target ON public.service_dependencies(target_node_id);
CREATE INDEX idx_event_mappings_type ON public.event_type_node_mappings(event_type_id);

-- =================================================================================
-- RLS (ROW LEVEL SECURITY)
-- =================================================================================
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_type_node_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scaling_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_configuration_sessions ENABLE ROW LEVEL SECURITY;

-- 1. Reglas Públicas (Lectura) TODO EL GRAFO DE CONOCIMIENTO (Es Catálogo Inteligente)
CREATE POLICY "Public can view active event types" ON public.event_types FOR SELECT USING (is_active = TRUE OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));
CREATE POLICY "Public can view active service nodes" ON public.service_nodes FOR SELECT USING (is_active = TRUE OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));
CREATE POLICY "Public can view all mappings" ON public.event_type_node_mappings FOR SELECT USING (TRUE);
CREATE POLICY "Public can view dependencies" ON public.service_dependencies FOR SELECT USING (TRUE);
CREATE POLICY "Public can view scaling rules" ON public.scaling_rules FOR SELECT USING (TRUE);

-- 2. Reglas Administrativas (Edición del Knowledge Graph)
CREATE POLICY "Admins full access on event types" ON public.event_types FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));
CREATE POLICY "Admins full access on service nodes" ON public.service_nodes FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));
CREATE POLICY "Admins full access on mappings" ON public.event_type_node_mappings FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));
CREATE POLICY "Admins full access on dependencies" ON public.service_dependencies FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));
CREATE POLICY "Admins full access on scaling rules" ON public.scaling_rules FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));

-- 3. Reglas de Sesiones de Configuración (El Wizard)
CREATE POLICY "Clients can view their own sessions" ON public.event_configuration_sessions FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Clients can create sessions" ON public.event_configuration_sessions FOR INSERT WITH CHECK (auth.uid() = client_id OR client_id IS NULL);
CREATE POLICY "Clients can update their own sessions" ON public.event_configuration_sessions FOR UPDATE USING (auth.uid() = client_id OR client_id IS NULL);
CREATE POLICY "Admins view all sessions" ON public.event_configuration_sessions FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));
