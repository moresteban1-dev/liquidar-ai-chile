-- ============================================
-- ALIGN orders TABLE WITH APPLICATION CODE
-- ============================================
-- The application's OrderMapper and SupabaseOrderRepository reference columns
-- that may not exist in the production table (defined by 001_initial_schema.sql).
-- This migration adds any missing columns safely using IF NOT EXISTS.
-- ============================================

-- deleted_at: Used by SupabaseOrderRepository for soft-delete queries
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- cancelled_at: Used by Order domain aggregate for cancellation tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- cancellation_reason: Used by Order domain aggregate
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Verify the result
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;
