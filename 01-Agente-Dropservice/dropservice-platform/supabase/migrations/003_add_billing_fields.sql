-- Migration: 003_add_billing_fields
-- Description: Adds billing information columns to the profiles table

-- ============================================
-- 1. ADD BILLING COLUMNS TO PROFILES
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS billing_rut TEXT,
  ADD COLUMN IF NOT EXISTS billing_company_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- ============================================
-- 2. UPDATE RLS POLICIES (Optional if "Users can update own profile" already covers all columns)
-- ============================================
-- The existing policy "Users can update own profile" is FOR UPDATE USING (auth.uid() = id).
-- It allows updating *rows*, but we might need to verify if specific column permissions are restrictive.
-- Usually, in Supabase, row-level policies cover all columns unless defined otherwise.
-- So no new policy is strictly needed if the row-level update is already allowed.
