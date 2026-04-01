-- ============================================
-- FIX PROFILES RLS: Allow Admins to read ALL profiles
-- Required for JOINs (client info in quotations, provider info in bids)
-- ============================================

-- Add read-all policy for Admins
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'ADMIN'
    )
  );

-- Also allow Admins to read all provider_profiles (for bid details)
DROP POLICY IF EXISTS "Admins can view all provider profiles" ON public.provider_profiles;

CREATE POLICY "Admins can view all provider profiles" ON public.provider_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Allow providers to read their own provider_profile
DROP POLICY IF EXISTS "Providers can view own provider profile" ON public.provider_profiles;

CREATE POLICY "Providers can view own provider profile" ON public.provider_profiles
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Allow quotation_items to be read by admins
DROP POLICY IF EXISTS "Admins can view all quotation items" ON public.quotation_items;

CREATE POLICY "Admins can view all quotation items" ON public.quotation_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Allow orders to be managed by admins
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );
