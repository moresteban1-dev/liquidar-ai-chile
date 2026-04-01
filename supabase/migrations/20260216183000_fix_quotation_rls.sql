-- ============================================
-- FIX QUOTATION FLOW PERMISSIONS (RLS)
-- Allow Admins and Providers to manage Quotations/Bids
-- ============================================

-- QUOTATIONS
-- Drop existing potential conflict
DROP POLICY IF EXISTS "Admins can update quotations" ON public.quotations;

-- Allow Admins to update quotations (Assignment, Markup, Status)
CREATE POLICY "Admins can update quotations" ON public.quotations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- PROVIDER BIDS
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Providers can insert bids" ON public.provider_bids;
DROP POLICY IF EXISTS "Providers can view own bids" ON public.provider_bids;
DROP POLICY IF EXISTS "Admins can view all bids" ON public.provider_bids;
DROP POLICY IF EXISTS "Admins can update bids" ON public.provider_bids;

-- Allow Providers to insert bids
CREATE POLICY "Providers can insert bids" ON public.provider_bids
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'PROVEEDOR'
    )
  );

-- Allow Providers to view their own bids
CREATE POLICY "Providers can view own bids" ON public.provider_bids
  FOR SELECT USING (
    provider_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Allow Admins to view all bids
CREATE POLICY "Admins can view all bids" ON public.provider_bids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Allow Admins to update bids (e.g. select winner)
CREATE POLICY "Admins can update bids" ON public.provider_bids
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );
