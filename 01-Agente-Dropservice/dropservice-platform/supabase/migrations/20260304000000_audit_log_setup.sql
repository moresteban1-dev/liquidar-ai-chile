-- 🛡️ CAJA NEGRA (AUDIT LOGGING) PARA SUPERVISIÓN DE ENTIDADES CRÍTICAS
-- Implementación Inmutable (Enterprise CDC Pattern)

-- 1. Crear esquema protegido forense
CREATE SCHEMA IF NOT EXISTS audit;

-- 2. Revocar privilegios directos para que nadie (ni la app) pueda borrar o alterar los logs, solo superusuarios / anon no tiene acceso
REVOKE ALL ON SCHEMA audit FROM anon, authenticated;

-- 3. Crear Estructura Base de Auditoría
CREATE TABLE IF NOT EXISTS audit.history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id UUID NOT NULL, -- UUID de la entidad que se modificó 
    old_data JSONB, -- Estado previo (útil en UPDATE/DELETE)
    new_data JSONB, -- Nuevo estado (útil en INSERT/UPDATE)
    actor_id UUID,  -- Quien ejecutó la petición (auth.uid())
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexar por tabla y entidad para búsquedas rápidas al reconstruir históricos
CREATE INDEX IF NOT EXISTS idx_audit_history_table_record ON audit.history(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_history_actor ON audit.history(actor_id);

-- 4. Motor Pl/pgSQL del Trigger
CREATE OR REPLACE FUNCTION audit.if_modified_func()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
BEGIN
    -- Intentar capturar al usuario firmado en caso de que sea una llamada RLS desde PostgREST
    BEGIN
        v_actor_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_actor_id := NULL; -- Fue el sistema (Service Role) o una operación directa
    END;

    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit.history (table_name, action, record_id, old_data, new_data, actor_id)
        VALUES (TG_TABLE_NAME::TEXT, TG_OP, NEW.id, to_jsonb(OLD), to_jsonb(NEW), v_actor_id);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit.history (table_name, action, record_id, old_data, actor_id)
        VALUES (TG_TABLE_NAME::TEXT, TG_OP, OLD.id, to_jsonb(OLD), v_actor_id);
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
         INSERT INTO audit.history (table_name, action, record_id, new_data, actor_id)
         VALUES (TG_TABLE_NAME::TEXT, TG_OP, NEW.id, to_jsonb(NEW), v_actor_id);
         RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Correr como SECURITY DEFINER permite que funciones atadas a la tabla de auditoria escriban en el esquema audit independientemente de quién gatille la acción.

-- 5. Ligar el Gatillo (Trigger) a Tablas Maestras de Producción:
-- Quotations
DROP TRIGGER IF EXISTS trg_audit_quotations ON public.quotations;
CREATE TRIGGER trg_audit_quotations
AFTER INSERT OR UPDATE OR DELETE ON public.quotations
FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func();

-- Orders (Pagos y Entregas)
DROP TRIGGER IF EXISTS trg_audit_orders ON public.orders;
CREATE TRIGGER trg_audit_orders
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func();

-- Provider Bids
DROP TRIGGER IF EXISTS trg_audit_provider_bids ON public.provider_bids;
CREATE TRIGGER trg_audit_provider_bids
AFTER INSERT OR UPDATE OR DELETE ON public.provider_bids
FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func();
