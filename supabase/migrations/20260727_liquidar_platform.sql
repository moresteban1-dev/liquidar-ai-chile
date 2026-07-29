-- =============================================================================
-- Liquidar Platform Chile — Supabase Migration
-- Migration: 20260727_liquidar_platform
-- Description: Creates auction platform tables: vendors, lots, auctions, bids,
--              lot images, price alerts, and shipping quotes.
-- =============================================================================

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE lote_estado AS ENUM ('activo', 'terminando_pronto', 'terminado', 'cancelado');
CREATE TYPE lote_condicion AS ENUM ('nuevo', 'como_nuevo', 'bueno', 'aceptable');
CREATE TYPE puja_tipo AS ENUM ('manual', 'proxy');
CREATE TYPE vendedor_estado AS ENUM ('activo', 'inactivo', 'suspendido');
CREATE TYPE pago_estado AS ENUM ('pendiente', 'pendiente_verificacion', 'completado', 'fallido', 'reembolsado');
CREATE TYPE metodo_pago AS ENUM ('webpay', 'khipu', 'transferencia_manual');
CREATE TYPE categoria_lote AS ENUM (
  'electronica',
  'ropa',
  'muebles',
  'herramientas',
  'juguetes',
  'deportes',
  'electrodomesticos',
  'computacion',
  'hogar',
  'otros'
);

-- ─── Vendedores ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vendedores (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre_empresa  TEXT NOT NULL,
  rut             TEXT NOT NULL UNIQUE,
  descripcion     TEXT,
  logo_url        TEXT,
  telefono        TEXT,
  email           TEXT NOT NULL,
  ciudad          TEXT NOT NULL,
  region          TEXT NOT NULL,  -- Region ID e.g. 'RM', 'V'
  estado          vendedor_estado NOT NULL DEFAULT 'activo',
  total_lotes     INTEGER NOT NULL DEFAULT 0,
  rating          NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating >= 1 AND rating <= 5),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Subastas (auction events that can group multiple lots) ───────────────────

CREATE TABLE IF NOT EXISTS subastas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo      TEXT NOT NULL,
  descripcion TEXT,
  tipo        TEXT NOT NULL DEFAULT 'lote_unico', -- 'lote_unico' | 'multiple'
  estado      lote_estado NOT NULL DEFAULT 'activo',
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin    TIMESTAMPTZ NOT NULL,
  vendedor_id  UUID REFERENCES vendedores(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Lotes ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lotes (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo            TEXT NOT NULL,
  descripcion       TEXT NOT NULL,
  categoria         categoria_lote NOT NULL,
  precio_base       INTEGER NOT NULL CHECK (precio_base > 0),        -- CLP integer
  precio_actual     INTEGER NOT NULL CHECK (precio_actual >= precio_base),  -- CLP integer
  incremento_minimo INTEGER NOT NULL DEFAULT 1000 CHECK (incremento_minimo > 0), -- CLP integer
  estado            lote_estado NOT NULL DEFAULT 'activo',
  fecha_inicio      TIMESTAMPTZ NOT NULL,
  fecha_fin         TIMESTAMPTZ NOT NULL,
  vendedor_id       UUID NOT NULL REFERENCES vendedores(id) ON DELETE RESTRICT,
  subasta_id        UUID REFERENCES subastas(id) ON DELETE SET NULL,
  region            TEXT NOT NULL,  -- Region ID
  comuna            TEXT NOT NULL,
  lote_numero       TEXT NOT NULL UNIQUE,
  peso_kg           NUMERIC(8, 2),
  volumen_m3        NUMERIC(8, 3),
  condicion         lote_condicion NOT NULL DEFAULT 'bueno',
  retailer_origen   TEXT NOT NULL,
  total_pujas       INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fecha_fin_despues_inicio CHECK (fecha_fin > fecha_inicio)
);

-- ─── Imagenes de Lote ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS imagenes_lote (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lote_id      UUID NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
  -- Supabase Storage path: e.g. 'lotes/{lote_id}/{filename}'
  storage_path TEXT NOT NULL,
  -- Public URL from Supabase Storage CDN
  url          TEXT NOT NULL,
  orden        SMALLINT NOT NULL DEFAULT 0,
  es_principal BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Pujas ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pujas (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lote_id            UUID NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monto              INTEGER NOT NULL CHECK (monto > 0),  -- CLP integer
  tipo               puja_tipo NOT NULL DEFAULT 'manual',
  proxy_monto_maximo INTEGER CHECK (proxy_monto_maximo IS NULL OR proxy_monto_maximo >= monto),
  es_ganadora        BOOLEAN NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Alertas de Precio ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alertas_precio (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lote_id      UUID NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
  monto_alerta INTEGER NOT NULL CHECK (monto_alerta > 0),
  activa       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lote_id)
);

-- ─── Pagos ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pagos (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  lote_id             UUID NOT NULL REFERENCES lotes(id) ON DELETE RESTRICT,
  puja_id             UUID REFERENCES pujas(id) ON DELETE SET NULL,
  monto               INTEGER NOT NULL CHECK (monto > 0),  -- CLP integer
  metodo              metodo_pago NOT NULL,
  estado              pago_estado NOT NULL DEFAULT 'pendiente',
  -- Transbank
  webpay_token        TEXT,
  webpay_buy_order    TEXT,
  -- Khipu
  khipu_payment_id    TEXT,
  -- Transferencia manual
  comprobante_url     TEXT,  -- Supabase Storage path
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  pagado_at           TIMESTAMPTZ
);

-- ─── Envios ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS envios (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pago_id         UUID REFERENCES pagos(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  lote_id         UUID NOT NULL REFERENCES lotes(id) ON DELETE RESTRICT,
  region_destino  TEXT NOT NULL,
  comuna_destino  TEXT NOT NULL,
  direccion       TEXT NOT NULL,
  precio_envio    INTEGER NOT NULL CHECK (precio_envio >= 0),  -- CLP integer
  transportista   TEXT,
  tracking_number TEXT,
  estado          TEXT NOT NULL DEFAULT 'pendiente',  -- 'pendiente' | 'en_camino' | 'entregado'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  entregado_at    TIMESTAMPTZ
);

-- =============================================================================
-- ÍNDICES
-- =============================================================================

CREATE INDEX idx_lotes_estado ON lotes (estado);
CREATE INDEX idx_lotes_categoria ON lotes (categoria);
CREATE INDEX idx_lotes_estado_categoria ON lotes (estado, categoria);
CREATE INDEX idx_lotes_fecha_fin ON lotes (fecha_fin ASC);
CREATE INDEX idx_lotes_vendedor_id ON lotes (vendedor_id);
CREATE INDEX idx_lotes_region ON lotes (region);

CREATE INDEX idx_pujas_lote_id_created ON pujas (lote_id, created_at DESC);
CREATE INDEX idx_pujas_user_id ON pujas (user_id);
CREATE INDEX idx_pujas_es_ganadora ON pujas (es_ganadora) WHERE es_ganadora = true;

CREATE INDEX idx_imagenes_lote_id ON imagenes_lote (lote_id, orden);
CREATE INDEX idx_alertas_user_id ON alertas_precio (user_id);
CREATE INDEX idx_pagos_user_id ON pagos (user_id);
CREATE INDEX idx_pagos_lote_id ON pagos (lote_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenes_lote ENABLE ROW LEVEL SECURITY;
ALTER TABLE pujas ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_precio ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE envios ENABLE ROW LEVEL SECURITY;

-- ─── Vendedores Policies ─────────────────────────────────────────────────────

-- Anyone can read active vendors
CREATE POLICY vendedores_read_public ON vendedores
  FOR SELECT USING (estado = 'activo');

-- Vendors can update their own profile
CREATE POLICY vendedores_update_own ON vendedores
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── Lotes Policies ──────────────────────────────────────────────────────────

-- Anyone can read active lots
CREATE POLICY lotes_read_public ON lotes
  FOR SELECT USING (true);

-- Only the lot's vendor can insert/update
CREATE POLICY lotes_insert_vendor ON lotes
  FOR INSERT WITH CHECK (
    vendedor_id IN (SELECT id FROM vendedores WHERE user_id = auth.uid())
  );

CREATE POLICY lotes_update_vendor ON lotes
  FOR UPDATE USING (
    vendedor_id IN (SELECT id FROM vendedores WHERE user_id = auth.uid())
  );

-- ─── Imagenes Policies ───────────────────────────────────────────────────────

CREATE POLICY imagenes_read_public ON imagenes_lote
  FOR SELECT USING (true);

-- ─── Pujas Policies ──────────────────────────────────────────────────────────

-- Users can read bids for any lot (to show bid history)
CREATE POLICY pujas_read_public ON pujas
  FOR SELECT USING (true);

-- Users can only insert their own bids
CREATE POLICY pujas_insert_own ON pujas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Alertas Policies ────────────────────────────────────────────────────────

CREATE POLICY alertas_read_own ON alertas_precio
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY alertas_insert_own ON alertas_precio
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY alertas_delete_own ON alertas_precio
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Pagos Policies ──────────────────────────────────────────────────────────

CREATE POLICY pagos_read_own ON pagos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY pagos_insert_own ON pagos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Envios Policies ─────────────────────────────────────────────────────────

CREATE POLICY envios_read_own ON envios
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGERS — Auto-update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_lotes_updated_at
  BEFORE UPDATE ON lotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_vendedores_updated_at
  BEFORE UPDATE ON vendedores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pagos_updated_at
  BEFORE UPDATE ON pagos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TRIGGER — Auto-update lote precio_actual and total_pujas when a new bid is added
-- =============================================================================

CREATE OR REPLACE FUNCTION on_nueva_puja()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current price and bid count on the lot
  UPDATE lotes
  SET
    precio_actual = GREATEST(precio_actual, NEW.monto),
    total_pujas   = total_pujas + 1,
    updated_at    = now()
  WHERE id = NEW.lote_id;

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER trigger_on_nueva_puja
  AFTER INSERT ON pujas
  FOR EACH ROW EXECUTE FUNCTION on_nueva_puja();
