-- ============================================
-- HOTFIX: Fix Order Status Enum Mismatch
-- Adds missing V2 statuses to the database enum
-- ERROR REFERENCE: invalid input value for enum order_status: "PAGADA"
-- ============================================

-- NOTE: ALTER TYPE cannot run inside a transaction block.
-- Run these statements one by one if using a transactional migration tool.
-- In Supabase SQL Editor, you can usually run the whole block.

ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'PAGADA';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'EN_PRODUCCION';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'REVISION_INTERNA';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'EN_REVISION';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'REEMBOLSADA';

-- Verify the new values
SELECT enum_range(NULL::public.order_status);
