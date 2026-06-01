-- ============================================================
-- MIGRACIÓN: Agregar Proveedor de IA Blackbox.ai
-- Fecha: 2026-05-31
-- Descripción: Agrega el registro para Blackbox.ai en la tabla ai_providers
-- ============================================================

INSERT INTO public.ai_providers (name, slug, default_model, is_active)
VALUES ('Blackbox.ai', 'blackbox', 'blackboxai/blackbox-pro', false)
ON CONFLICT (slug) DO NOTHING;
