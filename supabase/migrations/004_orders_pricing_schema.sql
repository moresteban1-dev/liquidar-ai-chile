-- ============================================
-- ORDERS & PRICING SCHEMA
-- ============================================

-- Orders Table (actualización)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
  
  -- Estado
  state VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  
  -- Detalles del evento
  event_date TIMESTAMP NOT NULL,
  event_type VARCHAR(100),
  estimated_guests INTEGER,
  
  -- Entrega
  delivery_address TEXT NOT NULL,
  special_instructions TEXT,
  
  -- Notas internas
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  deleted_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_state CHECK (
    state IN (
      'DRAFT',
      'QUOTATION_PENDING',
      'QUOTATION_SENT',
      'QUOTATION_APPROVED',
      'PAYMENT_PENDING',
      'PAYMENT_RECEIVED',
      'IN_PRODUCTION',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED'
    )
  ),
  CONSTRAINT valid_event_date CHECK (event_date >= CURRENT_DATE),
  CONSTRAINT positive_guests CHECK (estimated_guests IS NULL OR estimated_guests > 0)
);

-- Order Pricing Table
CREATE TABLE IF NOT EXISTS order_pricing (
  order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  
  provider_cost DECIMAL(12, 2) NOT NULL,
  admin_commission DECIMAL(12, 2) NOT NULL,
  platform_fee DECIMAL(12, 2) NOT NULL,
  taxes DECIMAL(12, 2) NOT NULL,
  final_price DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_amounts CHECK (
    provider_cost > 0 AND
    admin_commission >= 0 AND
    platform_fee >= 0 AND
    taxes >= 0 AND
    final_price > 0
  ),
  -- Invariante: final_price = provider_cost + admin_commission + platform_fee + taxes
  CONSTRAINT pricing_invariant CHECK (
    ABS(final_price - (provider_cost + admin_commission + platform_fee + taxes)) < 0.01
  )
);

-- ============================================
-- ÍNDICES
-- ============================================

-- Orders
CREATE INDEX idx_orders_client_state ON orders(client_id, state) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_provider_state ON orders(provider_id, state) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_event_date ON orders(event_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_state ON orders(state) WHERE deleted_at IS NULL;

-- Índice para órdenes activas
CREATE INDEX idx_orders_active ON orders(created_at DESC) 
WHERE deleted_at IS NULL AND state NOT IN ('COMPLETED', 'CANCELLED');

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER order_pricing_updated_at
  BEFORE UPDATE ON order_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_pricing ENABLE ROW LEVEL SECURITY;

-- Clients pueden ver solo sus órdenes
CREATE POLICY orders_client_select ON orders
  FOR SELECT
  USING (auth.uid()::uuid = client_id);

-- Providers pueden ver órdenes asignadas a ellos
CREATE POLICY orders_provider_select ON orders
  FOR SELECT
  USING (auth.uid()::uuid = provider_id);

-- Admins pueden ver todo
CREATE POLICY orders_admin_select ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::uuid
      AND users.role = 'admin'
    )
  );

-- Pricing: Clients solo ven su pricing
CREATE POLICY pricing_client_select ON order_pricing
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_pricing.order_id
      AND orders.client_id = auth.uid()::uuid
    )
  );

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Obtener orden con pricing
CREATE OR REPLACE FUNCTION get_order_with_pricing(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'order', row_to_json(o.*),
    'pricing', row_to_json(p.*)
  ) INTO result
  FROM orders o
  LEFT JOIN order_pricing p ON p.order_id = o.id
  WHERE o.id = p_order_id
  AND o.deleted_at IS NULL;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Estadísticas de órdenes por estado
CREATE OR REPLACE FUNCTION get_orders_stats()
RETURNS TABLE (
  state VARCHAR,
  count BIGINT,
  total_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.state,
    COUNT(o.id) as count,
    COALESCE(SUM(p.final_price), 0) as total_value
  FROM orders o
  LEFT JOIN order_pricing p ON p.order_id = o.id
  WHERE o.deleted_at IS NULL
  GROUP BY o.state
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE orders IS 'Órdenes de servicio en la plataforma';
COMMENT ON TABLE order_pricing IS 'Desglose de pricing de órdenes';

COMMENT ON COLUMN orders.state IS 'Estado actual de la orden (FSM)';
COMMENT ON COLUMN orders.event_date IS 'Fecha del evento (debe ser >= hoy)';
COMMENT ON COLUMN order_pricing.provider_cost IS 'Costo que paga admin al proveedor';
COMMENT ON COLUMN order_pricing.admin_commission IS 'Comisión del admin';
COMMENT ON COLUMN order_pricing.platform_fee IS 'Fee de la plataforma';
COMMENT ON COLUMN order_pricing.taxes IS 'Impuestos (IVA, etc.)';
COMMENT ON COLUMN order_pricing.final_price IS 'Precio total que paga el cliente';
