-- supabase/migrations/20260327_migrate_statuses_to_english.sql

-- ═══════════════════════════════════════════
-- MIGRACIÓN DE ESTADOS: Español → Inglés (Enum Safe)
-- ═══════════════════════════════════════════

-- IMPORTANTE: Ejecuta este archivo en DOS PASOS ( batches ) diferentes 
-- debido a restricciones de PostgreSQL con tipos ENUM.

-- ─────────────────────────────────────────────
-- PASO 1: Expandir Enums (EJECUTAR ESTA PARTE SOLA)
-- ─────────────────────────────────────────────

ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'IN_PRODUCTION';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'INTERNAL_REVIEW';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'REVISION_REQUESTED';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'QUALITY_REVIEW';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'REFUNDED';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'DISPUTED';

ALTER TYPE public.quotation_public_status ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE public.quotation_public_status ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
ALTER TYPE public.quotation_public_status ADD VALUE IF NOT EXISTS 'AWAITING_PROVIDER';
ALTER TYPE public.quotation_public_status ADD VALUE IF NOT EXISTS 'NEGOTIATING';
ALTER TYPE public.quotation_public_status ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE public.quotation_public_status ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE public.quotation_public_status ADD VALUE IF NOT EXISTS 'SENT_TO_CLIENT';
ALTER TYPE public.quotation_public_status ADD VALUE IF NOT EXISTS 'AWAITING_PAYMENT';
ALTER TYPE public.quotation_public_status ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE public.quotation_public_status ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE public.quotation_public_status ADD VALUE IF NOT EXISTS 'COMPLETED';

-- ─────────────────────────────────────────────
-- PASO 2: Migrar Datos (EJECUTAR ESTA PARTE DESPUÉS DEL PASO 1)
-- ─────────────────────────────────────────────

BEGIN;

-- ─── ORDERS ───
UPDATE public.orders SET status = 'DRAFT'           WHERE status::text IN ('BORRADOR', 'DRAFT');
UPDATE public.orders SET status = 'PENDING_PAYMENT'  WHERE status::text IN ('PENDIENTE_PAGO', 'ESPERANDO_PAGO', 'PENDIENTE', 'PENDING_PAYMENT');
UPDATE public.orders SET status = 'PAID'             WHERE status::text IN ('PAGADO', 'PAGADA', 'PAID');
UPDATE public.orders SET status = 'IN_PRODUCTION'    WHERE status::text IN ('EN_PRODUCCION', 'IN_PROGRESS', 'IN_PRODUCTION');
UPDATE public.orders SET status = 'UNDER_REVIEW'     WHERE status::text IN ('EN_REVISION', 'REVISION_INTERNA', 'QUALITY_REVIEW', 'UNDER_REVIEW', 'EN_REPOSICIÓN');
UPDATE public.orders SET status = 'DELIVERED'         WHERE status::text IN ('ENTREGADO', 'ENTREGADA', 'DELIVERED');
UPDATE public.orders SET status = 'COMPLETED'         WHERE status::text IN ('COMPLETADO', 'COMPLETADA', 'COMPLETED');
UPDATE public.orders SET status = 'CANCELLED'         WHERE status::text IN ('CANCELADO', 'CANCELADA', 'CANCELLED');
UPDATE public.orders SET status = 'REFUNDED'          WHERE status::text IN ('REEMBOLSADO', 'REEMBOLSADA', 'REFUNDED');
UPDATE public.orders SET status = 'DISPUTED'          WHERE status::text IN ('EN_DISPUTA', 'DISPUTED');

-- ─── QUOTATIONS ───
UPDATE public.quotations SET public_status = 'DRAFT'             WHERE public_status::text IN ('BORRADOR', 'DRAFT');
UPDATE public.quotations SET public_status = 'PENDING_REVIEW'    WHERE public_status::text IN ('PENDIENTE', 'PENDIENTE_REVISION', 'PENDING_REVIEW');
UPDATE public.quotations SET public_status = 'APPROVED'          WHERE public_status::text IN ('APROBADO', 'APROBADA', 'APPROVED');
UPDATE public.quotations SET public_status = 'REJECTED'          WHERE public_status::text IN ('RECHAZADO', 'RECHAZADA', 'REJECTED');
UPDATE public.quotations SET public_status = 'SENT_TO_CLIENT'    WHERE public_status::text IN ('ENVIADO', 'ENVIADA', 'SENT_TO_CLIENT');
UPDATE public.quotations SET public_status = 'PAID'              WHERE public_status::text IN ('PAGADO', 'PAGADA', 'PAID');
UPDATE public.quotations SET public_status = 'CANCELLED'         WHERE public_status::text IN ('CANCELADO', 'CANCELADA', 'CANCELLED');
UPDATE public.quotations SET public_status = 'COMPLETED'         WHERE public_status::text IN ('COMPLETADO', 'COMPLETADA', 'COMPLETED');

-- ─── VERIFICACIÓN ───
DO $$
DECLARE
  unmigrated_orders TEXT;
  unmigrated_quotes TEXT;
BEGIN
  SELECT string_agg(DISTINCT status::text, ', ')
  INTO unmigrated_orders
  FROM public.orders
  WHERE status::text NOT IN (
    'DRAFT', 'PENDING_PAYMENT', 'PAID', 'IN_PRODUCTION', 'UNDER_REVIEW',
    'INTERNAL_REVIEW', 'DELIVERED', 'COMPLETED',
    'CANCELLED', 'REFUNDED', 'DISPUTED'
  ) AND status IS NOT NULL;

  SELECT string_agg(DISTINCT public_status::text, ', ')
  INTO unmigrated_quotes
  FROM public.quotations
  WHERE public_status::text NOT IN (
    'DRAFT', 'PENDING_REVIEW', 'AWAITING_PROVIDER', 'NEGOTIATING',
    'APPROVED', 'REJECTED', 'SENT_TO_CLIENT', 'AWAITING_PAYMENT',
    'PAID', 'CANCELLED', 'COMPLETED'
  ) AND public_status IS NOT NULL;

  IF unmigrated_orders IS NOT NULL THEN
    RAISE WARNING 'Unmigrated order statuses: %', unmigrated_orders;
  END IF;

  IF unmigrated_quotes IS NOT NULL THEN
    RAISE WARNING 'Unmigrated quotation statuses: %', unmigrated_quotes;
  END IF;

  IF unmigrated_orders IS NULL AND unmigrated_quotes IS NULL THEN
    RAISE NOTICE 'All statuses migrated successfully to English Enums';
  END IF;
END $$;

COMMIT;
