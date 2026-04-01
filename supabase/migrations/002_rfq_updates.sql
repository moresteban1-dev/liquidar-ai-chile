-- Migration: 002_rfq_updates
-- Description: Implements the Triple Handshake RFQ Flow and Blind Pricing Security

-- ============================================
-- 1. CREATE UNIFIED STATUS ENUM
-- ============================================

CREATE TYPE quotation_status_new AS ENUM (
  'DRAFT',
  'PENDING_ASSIGNMENT',    -- Cliente creó solicitud, espera Admin
  'PENDING_PROVIDER_BID',  -- Admin asignó proveedor, espera Cotización
  'PENDING_ADMIN_APPROVAL',-- Proveedor cotizó, espera Markup del Admin
  'AWAITING_CLIENT_PAYMENT',-- Admin aprobó, espera pago del Cliente
  'APPROVED',              -- Cliente pagó, cotización cerrada/ganada
  'PAID',
  'FULFILLED',             -- Evento realizado
  'CANCELLED'              -- Cancelada por cualquiera
);

-- ============================================
-- 2. MODIFY QUOTATIONS TABLE
-- ============================================

-- Add the new status column and financial columns
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS status quotation_status_new DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS provider_cost INT,      -- Costo directo del proveedor (Blind)
  ADD COLUMN IF NOT EXISTS admin_fee INT,          -- Margen de la plataforma
  ADD COLUMN IF NOT EXISTS total_client_price INT, -- Precio final (provider_cost + admin_fee)
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;  -- Razón de rechazo (si aplica)

-- ============================================
-- 3. SECURITY: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (clean slate for this table recommended)
DROP POLICY IF EXISTS "Clients can view own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Anyone can read quotations" ON public.quotations;

-- 3.1 ADMIN: God mode (access to all rows)
-- Assumes public.profiles has 'ADMIN' role correctly set
CREATE POLICY "Admins can do everything" ON public.quotations
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- 3.2 PROVIDER: Can see only assigned tasks
CREATE POLICY "Providers can view assigned" ON public.quotations
  FOR SELECT
  USING (
    auth.uid() = assigned_provider_id
  );

CREATE POLICY "Providers can update assigned" ON public.quotations
  FOR UPDATE
  USING (
    auth.uid() = assigned_provider_id
  );

-- 3.3 CLIENT: Can see only their own requests
CREATE POLICY "Clients can view own" ON public.quotations
  FOR SELECT
  USING (
    auth.uid() = client_id
  );

-- ============================================
-- 4. SECURE VIEW FOR CLIENTS (Blind Pricing Guarantee)
-- ============================================
-- This view explicitly EXCLUDES provider_cost and admin_fee.
-- Frontend for Clients should prefer querying this View or select specific columns.

CREATE OR REPLACE VIEW public.client_safe_quotations AS
SELECT
  id,
  code,
  client_id,
  service_id,
  brief,
  event_start_date,
  event_end_date,
  event_location,
  status,
  total_client_price, -- SECURE: Only the final price is exposed
  valid_until,
  created_at,
  updated_at
FROM public.quotations;

-- Grant standard permissions to authenticated users so they can query the view
GRANT SELECT ON public.client_safe_quotations TO authenticated;

-- ============================================
-- 5. FUNCTION TO CALCULATE TOTAL (Optional Trigger)
-- ============================================
-- Automatically calculates total when admin_fee updates, if desired.
-- For now, we leave it to the application logic to keep it simple and explicit.
