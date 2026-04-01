-- ============================================
-- TRIGGER: Sincronización automática de estados
-- Cuando se actualiza `status`, deriva automáticamente
-- `public_status` e `internal_status` (legacy).
--
-- Fuente de verdad: campo `status` (QuotationInternalStatus)
-- Valores: DRAFT, PENDING_ASSIGNMENT, PENDING_PROVIDER_BID,
--          PENDING_ADMIN_APPROVAL, AWAITING_CLIENT_PAYMENT,
--          APPROVED, PAID, FULFILLED, CANCELLED, REJECTED
-- ============================================

-- 1. Crear función de trigger
CREATE OR REPLACE FUNCTION sync_quotation_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actuar si `status` cambió
  IF NEW.status IS DISTINCT FROM OLD.status THEN

    -- Derivar public_status (lo que ve el cliente)
    -- Mapa idéntico a INTERNAL_TO_PUBLIC_MAP en quotation-fsm.ts
    NEW.public_status = CASE NEW.status
      WHEN 'DRAFT'                    THEN 'RECIBIDA'
      WHEN 'PENDING_ASSIGNMENT'       THEN 'RECIBIDA'
      WHEN 'PENDING_PROVIDER_BID'     THEN 'EN_PROCESO'
      WHEN 'PENDING_ADMIN_APPROVAL'   THEN 'EN_PROCESO'
      WHEN 'AWAITING_CLIENT_PAYMENT'  THEN 'COTIZADA'
      WHEN 'APPROVED'                 THEN 'APROBADA'
      WHEN 'PAID'                     THEN 'APROBADA'
      WHEN 'FULFILLED'                THEN 'APROBADA'
      WHEN 'CANCELLED'                THEN 'RECHAZADA'
      WHEN 'REJECTED'                 THEN 'RECHAZADA'
      ELSE NEW.public_status  -- Fallback: mantener actual
    END;

    -- Derivar internal_status (enum legacy español en DB)
    -- Mapa idéntico a QuotationMapper.toPersistence()
    NEW.internal_status = CASE NEW.status
      WHEN 'DRAFT'                    THEN 'PENDIENTE_ASIGNACION'
      WHEN 'PENDING_ASSIGNMENT'       THEN 'PENDIENTE_ASIGNACION'
      WHEN 'PENDING_PROVIDER_BID'     THEN 'PROVEEDOR_COTIZANDO'
      WHEN 'PENDING_ADMIN_APPROVAL'   THEN 'PROVEEDOR_COTIZANDO'
      WHEN 'AWAITING_CLIENT_PAYMENT'  THEN 'ESPERANDO_CLIENTE'
      WHEN 'APPROVED'                 THEN 'ESPERANDO_CLIENTE'
      WHEN 'PAID'                     THEN 'ESPERANDO_CLIENTE'
      WHEN 'FULFILLED'                THEN 'ESPERANDO_CLIENTE'
      WHEN 'CANCELLED'                THEN 'PENDIENTE_ASIGNACION'
      WHEN 'REJECTED'                 THEN 'PENDIENTE_ASIGNACION'
      ELSE NEW.internal_status  -- Fallback: mantener actual
    END;

    -- Actualizar timestamp
    NEW.updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear trigger (reemplazar si existe)
DROP TRIGGER IF EXISTS quotation_status_sync ON quotations;

CREATE TRIGGER quotation_status_sync
  BEFORE UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION sync_quotation_status();

-- 3. Sincronizar datos existentes (una sola vez, idempotente)
UPDATE quotations SET
  public_status = CASE status
    WHEN 'DRAFT'                    THEN 'RECIBIDA'
    WHEN 'PENDING_ASSIGNMENT'       THEN 'RECIBIDA'
    WHEN 'PENDING_PROVIDER_BID'     THEN 'EN_PROCESO'
    WHEN 'PENDING_ADMIN_APPROVAL'   THEN 'EN_PROCESO'
    WHEN 'AWAITING_CLIENT_PAYMENT'  THEN 'COTIZADA'
    WHEN 'APPROVED'                 THEN 'APROBADA'
    WHEN 'PAID'                     THEN 'APROBADA'
    WHEN 'FULFILLED'                THEN 'APROBADA'
    WHEN 'CANCELLED'                THEN 'RECHAZADA'
    WHEN 'REJECTED'                 THEN 'RECHAZADA'
    ELSE public_status
  END,
  internal_status = CASE status
    WHEN 'DRAFT'                    THEN 'PENDIENTE_ASIGNACION'
    WHEN 'PENDING_ASSIGNMENT'       THEN 'PENDIENTE_ASIGNACION'
    WHEN 'PENDING_PROVIDER_BID'     THEN 'PROVEEDOR_COTIZANDO'
    WHEN 'PENDING_ADMIN_APPROVAL'   THEN 'PROVEEDOR_COTIZANDO'
    WHEN 'AWAITING_CLIENT_PAYMENT'  THEN 'ESPERANDO_CLIENTE'
    WHEN 'APPROVED'                 THEN 'ESPERANDO_CLIENTE'
    WHEN 'PAID'                     THEN 'ESPERANDO_CLIENTE'
    WHEN 'FULFILLED'                THEN 'ESPERANDO_CLIENTE'
    WHEN 'CANCELLED'                THEN 'PENDIENTE_ASIGNACION'
    WHEN 'REJECTED'                 THEN 'PENDIENTE_ASIGNACION'
    ELSE internal_status
  END;

-- 4. Verificar consistencia
SELECT
  status,
  internal_status,
  public_status,
  COUNT(*) as cantidad
FROM quotations
GROUP BY status, internal_status, public_status
ORDER BY status;
