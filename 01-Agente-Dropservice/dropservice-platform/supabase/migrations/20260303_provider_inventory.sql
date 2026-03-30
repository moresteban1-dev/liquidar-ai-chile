-- ==========================================
-- Módulo de Inventario del Proveedor (V2)
-- ==========================================

-- Tabla que vincula a un proveedor con los ítems del catálogo que ofrece.
-- Permite registrar costos base, disponibilidad y cantidad.

CREATE TABLE IF NOT EXISTS provider_catalog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relaciones
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
    
    -- Pricing y Stock
    cost_per_unit INTEGER NOT NULL, -- Costo neto que cobra el proveedor (sin IVA)
    available_quantity INTEGER DEFAULT NULL, -- NULL = ilimitado (servicios), INTEGER = stock físico
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Logística
    min_rental_days INTEGER DEFAULT 1,
    advance_booking_days INTEGER DEFAULT 0,
    
    -- Estado Físico (solo para EQUIPMENT)
    equipment_condition VARCHAR(30) CHECK (equipment_condition IN ('NEW', 'EXCELLENT', 'GOOD', 'FAIR')),
    equipment_year INTEGER,
    
    -- Metadatos y Estados
    notes TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Restricciones
    UNIQUE(provider_id, item_id)
);

-- Índices para performance en matching y consultas de panel
CREATE INDEX IF NOT EXISTS idx_pci_provider_id ON provider_catalog_items(provider_id);
CREATE INDEX IF NOT EXISTS idx_pci_item_id ON provider_catalog_items(item_id);
CREATE INDEX IF NOT EXISTS idx_pci_is_available ON provider_catalog_items(is_available) WHERE is_available = TRUE;

-- Row Level Security (RLS)
ALTER TABLE provider_catalog_items ENABLE ROW LEVEL SECURITY;

-- Política: Proveedores leen y escriben su propio inventario
CREATE POLICY "Providers can manage their own inventory" 
ON provider_catalog_items
FOR ALL
USING (
    provider_id IN (
        SELECT id FROM provider_profiles WHERE user_id = auth.uid()
    )
);

-- Política: Admin lee todo el inventario para el motor de matching
CREATE POLICY "Admins can view all inventory" 
ON provider_catalog_items
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pci_updated_at
    BEFORE UPDATE ON provider_catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
