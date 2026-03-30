-- ============================================================================
-- SEED DATA: Down Payment Configuration (Fase 3)
-- ============================================================================
-- Inserts the dynamic down payment percentage required to confirm an event.

INSERT INTO public.platform_config (key, value, description)
VALUES 
    ('DOWN_PAYMENT_PERCENTAGE', '30', 'Porcentaje de anticipo exigido para confirmar un evento y reservar fecha.')
ON CONFLICT (key) DO NOTHING;
