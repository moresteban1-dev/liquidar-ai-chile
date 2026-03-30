-- Migration: service_dependencies (Sprint 5.2)
-- Description: Creates the many-to-many relationship table for service dependencies (Edges).

CREATE TABLE IF NOT EXISTS public.service_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_node_id UUID NOT NULL REFERENCES public.service_nodes(id) ON DELETE CASCADE,
    child_node_id UUID NOT NULL REFERENCES public.service_nodes(id) ON DELETE CASCADE,
    dependency_type TEXT DEFAULT 'REQUIRED' CHECK (dependency_type IN ('REQUIRED', 'OPTIONAL', 'RECOMENDED')),
    min_quantity NUMERIC(10,2) DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(parent_node_id, child_node_id)
);

-- Index for graph traversal (downward)
CREATE INDEX IF NOT EXISTS idx_service_dependencies_parent ON public.service_dependencies(parent_node_id);

-- Updated timestamp trigger
CREATE TRIGGER handle_updated_at_service_dependencies
    BEFORE UPDATE ON public.service_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.service_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to service_dependencies for authenticated users"
    ON public.service_dependencies FOR SELECT
    USING (auth.role() = 'authenticated');

-- TABLA 4: Event Type -> Service Nodes (Baseline Junction)
CREATE TABLE IF NOT EXISTS public.event_type_service_nodes (
    event_type_id UUID REFERENCES public.event_types(id) ON DELETE CASCADE,
    service_node_id UUID REFERENCES public.service_nodes(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 1, -- 1 = Required, 2 = Recommended
    PRIMARY KEY (event_type_id, service_node_id)
);

ALTER TABLE public.event_type_service_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to event_type_service_nodes for authenticated users"
    ON public.event_type_service_nodes FOR SELECT
    USING (auth.role() = 'authenticated');

-- SEED DATA FOR BASELINE & DEPENDENCIES
DO $$
DECLARE
    corp_conf_id UUID;
    workshop_id UUID;
    projector_id UUID;
    sound_id UUID;
    mic_id UUID;
    tech_id UUID;
    screen_id UUID;
BEGIN
    SELECT id INTO corp_conf_id FROM public.event_types WHERE code = 'CORP_CONFERENCE';
    SELECT id INTO workshop_id FROM public.event_types WHERE code = 'CORP_WORKSHOP';
    
    SELECT id INTO projector_id FROM public.service_nodes WHERE code = 'PROJECTOR';
    SELECT id INTO sound_id FROM public.service_nodes WHERE code = 'SOUND_BASIC';
    SELECT id INTO mic_id FROM public.service_nodes WHERE code = 'MICROPHONE';
    SELECT id INTO tech_id FROM public.service_nodes WHERE code = 'TECHNICIAN';
    SELECT id INTO screen_id FROM public.service_nodes WHERE code = 'SCREEN';

    -- Baseline for Conference
    INSERT INTO public.event_type_service_nodes (event_type_id, service_node_id, priority) VALUES
        (corp_conf_id, sound_id, 1),
        (corp_conf_id, mic_id, 1),
        (corp_conf_id, tech_id, 1)
    ON CONFLICT DO NOTHING;

    -- Dependencies: Projector REQUIRES Screen
    INSERT INTO public.service_dependencies (parent_node_id, child_node_id, dependency_type) VALUES
        (projector_id, screen_id, 'REQUIRED'),
        (sound_id, tech_id, 'REQUIRED')
    ON CONFLICT DO NOTHING;
END $$;
