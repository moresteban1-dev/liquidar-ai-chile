-- ============================================================
-- MIGRACIÓN CORRECTIVA: Corregir nombre de modelo de Blackbox.ai
-- Fecha: 2026-06-01
-- Descripción: Fuerza la corrección del default_model de Blackbox.ai.
--              El valor 'blackbox' era inválido según la API de Blackbox.ai.
--              El modelo correcto es 'blackboxai/blackbox-pro'.
-- ============================================================

UPDATE public.ai_providers
SET
  default_model = 'blackboxai/blackbox-pro',
  updated_at    = NOW()
WHERE
  slug = 'blackbox'
  AND (default_model = 'blackbox' OR default_model IS NULL OR default_model = '');
