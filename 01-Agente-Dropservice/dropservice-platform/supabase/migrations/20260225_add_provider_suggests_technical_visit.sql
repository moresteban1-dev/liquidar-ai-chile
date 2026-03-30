-- ============================================
-- ADD: Campo para que el proveedor sugiera visita técnica
-- El proveedor puede sugerir visita técnica al cotizar.
-- El admin ve esta sugerencia junto con la cotización del proveedor.
-- ============================================

-- 1. Agregar columna (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quotations'
        AND column_name = 'provider_suggests_technical_visit'
    ) THEN
        ALTER TABLE quotations
        ADD COLUMN provider_suggests_technical_visit BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Verificar
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'quotations'
AND column_name IN ('technical_visit', 'provider_suggests_technical_visit');
