-- ============================================
-- SUPABASE SCHEMA MIGRATION
-- DropService Platform - Eventos & Equipamiento
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'PROVEEDOR', 'CLIENTE');
CREATE TYPE price_type AS ENUM ('FIJO', 'COTIZABLE', 'DESDE');
CREATE TYPE quotation_public_status AS ENUM (
  'RECIBIDA', 
  'EN_PROCESO', 
  'COTIZADA', 
  'APROBADA', 
  'RECHAZADA', 
  'EXPIRADA'
);
CREATE TYPE quotation_internal_status AS ENUM (
  'PENDIENTE_ASIGNACION',
  'ASIGNADA',
  'PROVEEDOR_COTIZANDO',
  'READY_FOR_APPROVAL',
  'ESPERANDO_CLIENTE',
  'APROBADA_PENDIENTE_PAGO',
  'PAGADA',
  'EN_PRODUCCION',
  'ENTREGADA',
  'CERRADA',
  'CANCELADA'
);
CREATE TYPE order_status AS ENUM (
  'CONFIRMADA',
  'EN_PREPARACION',
  'LISTA_ENTREGA',
  'ENTREGADA',
  'COMPLETADA',
  'CANCELADA'
);
CREATE TYPE payment_status AS ENUM (
  'PENDIENTE',
  'PARCIAL',
  'PAGADO',
  'REEMBOLSADO'
);

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role user_role DEFAULT 'CLIENTE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies: Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- PROVIDER PROFILES (Internal only)
-- ============================================

CREATE TABLE public.provider_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialty TEXT,
  rating DECIMAL(2,1) DEFAULT 5.0,
  completed_orders INT DEFAULT 0,
  rut TEXT,
  bank_name TEXT,
  bank_account_type TEXT,
  bank_account_number TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CATEGORIES
-- ============================================

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  "order" INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories" ON public.categories
  FOR SELECT USING (true);

-- ============================================
-- SERVICES
-- ============================================

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.categories(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  price_from INT,
  price_to INT,
  price_type price_type DEFAULT 'COTIZABLE',
  image_url TEXT,
  features TEXT, -- JSON
  delivery_days INT,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active services" ON public.services
  FOR SELECT USING (is_active = true);

-- ============================================
-- EVENT EQUIPMENT (1:1 with Services)
-- ============================================

CREATE TABLE public.event_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID UNIQUE REFERENCES public.services(id) ON DELETE CASCADE,
  total_stock INT DEFAULT 1,
  dimensions TEXT,
  weight_kg DECIMAL(10,2),
  power_watts INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.event_equipment ENABLE ROW LEVEL SECURITY;

-- ============================================
-- QUOTATIONS
-- ============================================

CREATE TABLE public.quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.profiles(id),
  service_id UUID REFERENCES public.services(id),
  brief TEXT NOT NULL,
  requirements TEXT,
  attachments TEXT,
  event_start_date TIMESTAMPTZ,
  event_end_date TIMESTAMPTZ,
  event_location TEXT,
  event_time TEXT,
  setup_time TEXT,
  teardown_time TEXT,
  public_status quotation_public_status DEFAULT 'RECIBIDA',
  internal_status quotation_internal_status DEFAULT 'PENDIENTE_ASIGNACION',
  price_cost INT,
  price_net INT,
  price_iva INT,
  price_total INT,
  markup_percentage DECIMAL(5,2),
  markup_amount INT,
  valid_until TIMESTAMPTZ,
  internal_notes TEXT,
  selected_bid_id UUID,
  assigned_provider_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Clients can only see their own quotations
CREATE POLICY "Clients can view own quotations" ON public.quotations
  FOR SELECT USING (auth.uid() = client_id);

-- ============================================
-- QUOTATION ITEMS
-- ============================================

CREATE TABLE public.quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id),
  quantity INT DEFAULT 1,
  days INT DEFAULT 1,
  notes TEXT,
  unit_price INT,
  total_price INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROVIDER BIDS
-- ============================================

CREATE TABLE public.provider_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.profiles(id),
  cost_amount INT NOT NULL,
  delivery_days INT,
  notes TEXT,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.provider_bids ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORDERS
-- ============================================

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  quotation_id UUID UNIQUE REFERENCES public.quotations(id),
  client_id UUID REFERENCES public.profiles(id),
  provider_id UUID REFERENCES public.profiles(id),
  status order_status DEFAULT 'CONFIRMADA',
  payment_status payment_status DEFAULT 'PENDIENTE',
  price_net INT NOT NULL,
  price_iva INT NOT NULL,
  price_total INT NOT NULL,
  price_cost INT,
  profit_amount INT,
  event_date TIMESTAMPTZ,
  delivery_address TEXT,
  client_notes TEXT,
  internal_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = client_id);

-- ============================================
-- ORDER ITEMS
-- ============================================

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id),
  description TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unit_price INT NOT NULL,
  total_price INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PLATFORM CONFIG
-- ============================================

CREATE TABLE public.platform_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config
INSERT INTO public.platform_config (key, value, description) VALUES
  ('default_markup', '50', 'Porcentaje de markup por defecto'),
  ('iva_rate', '19', 'Tasa de IVA Chile'),
  ('currency', 'CLP', 'Moneda de la plataforma'),
  ('quotation_validity_days', '7', 'Días de validez de cotización');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at on all tables
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for quotations (Admin dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
