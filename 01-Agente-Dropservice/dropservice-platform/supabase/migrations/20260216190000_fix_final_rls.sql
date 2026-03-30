-- ============================================
-- FINAL FIX: RLS SELECT PERMISSIONS
-- Ensure Admins have explicit SELECT access to everything
-- ============================================

-- QUOTATIONS
-- Ensure Allow SELECT for Admins (Crucial for UPDATE RETURNING and GET operations)
DROP POLICY IF EXISTS "Admins can view all quotations" ON public.quotations;

CREATE POLICY "Admins can view all quotations" ON public.quotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- PROVIDER BIDS
-- Ensure Allow SELECT for Admins
DROP POLICY IF EXISTS "Admins can view all bids" ON public.provider_bids;

CREATE POLICY "Admins can view all bids" ON public.provider_bids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Double check UPDATE policies ensuring they don't block
DROP POLICY IF EXISTS "Admins can update quotations" ON public.quotations;
CREATE POLICY "Admins can update quotations" ON public.quotations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );
