-- ============================================================
-- MIGRACIÓN: Módulo de Pagos (Payment Module)
-- Fecha: 2026-02-18
-- Descripción: Tablas y políticas para MercadoPago, Webpay y Transferencias
-- ============================================================

-- 1. ENUM para estados de pago
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending',           -- Creado, esperando acción
        'processing',        -- En proceso en pasarela
        'approved',          -- Confirmado
        'rejected',          -- Rechazado
        'cancelled',         -- Cancelado por usuario
        'refunded',          -- Reembolsado
        'expired',           -- Expirado
        'pending_review'     -- Transferencia manual esperando admin
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLA: payment_gateways
CREATE TABLE IF NOT EXISTS payment_gateways (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(50) UNIQUE NOT NULL,
  description   TEXT,
  is_active     BOOLEAN DEFAULT false,
  config        JSONB DEFAULT '{}'::jsonb,
  display_order INT DEFAULT 0,
  icon_url      VARCHAR(500),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed de gateways
INSERT INTO payment_gateways (name, slug, description, display_order, is_active, config)
VALUES
(
  'Webpay (Transbank)',
  'webpay',
  'Paga con tarjeta de crédito o débito a través de Webpay Plus',
  1,
  false,
  '{"commerce_code": "", "api_key": "", "environment": "integration", "return_url": ""}'::jsonb
),
(
  'Transferencia Bancaria',
  'manual_transfer',
  'Realiza una transferencia bancaria y sube tu comprobante',
  2,
  false,
  '{"expiration_hours": 48, "instructions": "Realiza la transferencia y sube el comprobante de pago", "auto_expire": true}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- 3. TABLA: platform_settings (General settings including Bank Data)
CREATE TABLE IF NOT EXISTS platform_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key   VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  category      VARCHAR(50) NOT NULL DEFAULT 'general',
  description   TEXT,
  updated_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed de datos bancarios
INSERT INTO platform_settings (setting_key, setting_value, category, description)
VALUES
(
  'bank_account_data',
  '{
    "bank_name": "",
    "account_type": "corriente",
    "account_number": "",
    "holder_name": "",
    "holder_rut": "",
    "holder_email": "",
    "additional_notes": "Indicar número de orden en la descripción de la transferencia"
  }'::jsonb,
  'payments',
  'Datos de la cuenta bancaria para transferencias manuales'
)
ON CONFLICT (setting_key) DO NOTHING;

-- 4. TABLA: payments
CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL, -- FK to orders added later if table exists, logic handled in app
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  gateway_slug  VARCHAR(50) NOT NULL REFERENCES payment_gateways(slug),
  external_id   VARCHAR(255),
  amount        DECIMAL(12, 2) NOT NULL,
  currency      VARCHAR(3) DEFAULT 'CLP',
  status        payment_status DEFAULT 'pending',
  metadata      JSONB DEFAULT '{}'::jsonb,
  paid_at       TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway ON payments(gateway_slug);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- 5. TABLA: payment_logs
CREATE TABLE IF NOT EXISTS payment_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id    UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  action        VARCHAR(100) NOT NULL,
  old_status    payment_status,
  new_status    payment_status,
  performed_by  UUID REFERENCES auth.users(id),
  details       JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_payment ON payment_logs(payment_id);

-- 6. TABLA: webhook_events
CREATE TABLE IF NOT EXISTS webhook_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_slug  VARCHAR(50) NOT NULL,
  event_type    VARCHAR(100),
  payload       JSONB NOT NULL,
  processed     BOOLEAN DEFAULT false,
  payment_id    UUID REFERENCES payments(id),
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_gateway ON webhook_events(gateway_slug);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

-- 7. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payments_updated ON payments;
CREATE TRIGGER trg_payments_updated
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_payment_gateways_updated ON payment_gateways;
CREATE TRIGGER trg_payment_gateways_updated
  BEFORE UPDATE ON payment_gateways
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_platform_settings_updated ON platform_settings;
CREATE TRIGGER trg_platform_settings_updated
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Policies: payments
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can insert payments" ON payments;
CREATE POLICY "System can insert payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update payments" ON payments;
CREATE POLICY "System can update payments"
  ON payments FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policies: payment_gateways
DROP POLICY IF EXISTS "Anyone can view active gateways" ON payment_gateways;
CREATE POLICY "Anyone can view active gateways"
  ON payment_gateways FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can modify gateways" ON payment_gateways;
CREATE POLICY "Admins can modify gateways"
  ON payment_gateways FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policies: platform_settings
DROP POLICY IF EXISTS "Public can read payment settings" ON platform_settings;
CREATE POLICY "Public can read payment settings"
  ON platform_settings FOR SELECT
  USING (category = 'payments');

DROP POLICY IF EXISTS "Admins can modify settings" ON platform_settings;
CREATE POLICY "Admins can modify settings"
  ON platform_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policies: webhook_events (Admin only)
DROP POLICY IF EXISTS "Admins can view webhook events" ON webhook_events;
CREATE POLICY "Admins can view webhook events"
  ON webhook_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
