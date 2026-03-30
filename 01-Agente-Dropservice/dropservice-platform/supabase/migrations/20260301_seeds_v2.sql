-- ============================================================================
-- SEED DATA: Smart Catalog V2 (Phase 1)
-- ============================================================================
-- Run this script to populate the basic categories and initial 20 core items 
-- for the event production catalog.

-- Clear previous data if re-running (Optional, but be careful in production)
-- DELETE FROM public.catalog_items;
-- DELETE FROM public.catalog_categories;

-- ============================================================================
-- 1. ROOT CATEGORIES (Level 1)
-- ============================================================================
INSERT INTO public.catalog_categories (id, code, name, slug, level, path, item_type, status, display_order)
VALUES 
    -- 1. Audiovisual & Technical
    ('c0000000-0000-4000-a000-000000000001', 'CAT-AV', 'Audiovisual y Técnico', 'audiovisual-tecnico', 1, ARRAY['c0000000-0000-4000-a000-000000000001']::text[], 'MIXED', 'ACTIVE', 10),
    -- 2. Infrastructure & Furniture
    ('c0000000-0000-4000-a000-000000000002', 'CAT-INF', 'Infraestructura y Mobiliario', 'infraestructura-mobiliario', 1, ARRAY['c0000000-0000-4000-a000-000000000002']::text[], 'EQUIPMENT', 'ACTIVE', 20),
    -- 3. Staff & Talent
    ('c0000000-0000-4000-a000-000000000003', 'CAT-STAFF', 'Personal y Talento', 'personal-talento', 1, ARRAY['c0000000-0000-4000-a000-000000000003']::text[], 'SERVICE', 'ACTIVE', 30),
    -- 4. Food & Beverage
    ('c0000000-0000-4000-a000-000000000004', 'CAT-FB', 'Alimentos y Bebidas', 'alimentos-bebidas', 1, ARRAY['c0000000-0000-4000-a000-000000000004']::text[], 'MIXED', 'ACTIVE', 40)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. SUB-CATEGORIES (Level 2)
-- ============================================================================
INSERT INTO public.catalog_categories (id, parent_id, code, name, slug, level, path, item_type, status, display_order)
VALUES 
    -- Under Audiovisual
    ('c0000000-0000-4000-b000-000000000001', 'c0000000-0000-4000-a000-000000000001', 'CAT-AV-SND', 'Sonido y Amplificación', 'sonido-amplificacion', 2, ARRAY['c0000000-0000-4000-a000-000000000001', 'c0000000-0000-4000-b000-000000000001']::text[], 'MIXED', 'ACTIVE', 11),
    ('c0000000-0000-4000-b000-000000000002', 'c0000000-0000-4000-a000-000000000001', 'CAT-AV-ILU', 'Iluminación Decorativa y Perimetral', 'iluminacion', 2, ARRAY['c0000000-0000-4000-a000-000000000001', 'c0000000-0000-4000-b000-000000000002']::text[], 'EQUIPMENT', 'ACTIVE', 12),
    ('c0000000-0000-4000-b000-000000000003', 'c0000000-0000-4000-a000-000000000001', 'CAT-AV-VID', 'Pantallas y Video', 'pantallas-video', 2, ARRAY['c0000000-0000-4000-a000-000000000001', 'c0000000-0000-4000-b000-000000000003']::text[], 'EQUIPMENT', 'ACTIVE', 13),
    -- Under Infrastructure
    ('c0000000-0000-4000-b000-000000000004', 'c0000000-0000-4000-a000-000000000002', 'CAT-INF-TENT', 'Carpas y Toldos', 'carpas-toldos', 2, ARRAY['c0000000-0000-4000-a000-000000000002', 'c0000000-0000-4000-b000-000000000004']::text[], 'EQUIPMENT', 'ACTIVE', 21),
    ('c0000000-0000-4000-b000-000000000005', 'c0000000-0000-4000-a000-000000000002', 'CAT-INF-FURN', 'Mobiliario Lounge y Comedor', 'mobiliario', 2, ARRAY['c0000000-0000-4000-a000-000000000002', 'c0000000-0000-4000-b000-000000000005']::text[], 'EQUIPMENT', 'ACTIVE', 22),
    -- Under Staff
    ('c0000000-0000-4000-b000-000000000006', 'c0000000-0000-4000-a000-000000000003', 'CAT-STAFF-PROD', 'Productores y Coordinadores', 'productores-coordinadores', 2, ARRAY['c0000000-0000-4000-a000-000000000003', 'c0000000-0000-4000-b000-000000000006']::text[], 'SERVICE', 'ACTIVE', 31),
    ('c0000000-0000-4000-b000-000000000007', 'c0000000-0000-4000-a000-000000000003', 'CAT-STAFF-SEC', 'Seguridad y Control de Acceso', 'seguridad', 2, ARRAY['c0000000-0000-4000-a000-000000000003', 'c0000000-0000-4000-b000-000000000007']::text[], 'SERVICE', 'ACTIVE', 32)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 3. CORE CATALOG ITEMS (Top 20 Critical Services)
-- ============================================================================
INSERT INTO public.catalog_items (
    id, category_id, item_type, code, name, slug, short_description, full_description, 
    pricing_model, unit_label, price_reference_min, price_reference_max, price_suggested, 
    min_margin_percent, default_margin_percent, status, is_featured, is_popular, tags
)
VALUES 
-- AUDIOVISUAL
(
    '10000000-0000-4000-c000-000000000001', 'c0000000-0000-4000-b000-000000000001', 'EQUIPMENT', 'AV-SND-001', 
    'Sistema PA Line Array Básico (hasta 300 pax)', 'pa-line-array-basico-300pax',
    'Sistema de amplificación Line Array básico, perfecto para eventos corporativos y fiestas pequeñas. Incluye montaje.',
    'Sistema completo Line Array (ej. RCF, JBL, d&b) ideal para espacios medianos. Incluye 2 tops por lado, 1 sub por lado, mesa de mezcla digital (16 ch), microfonía básica (2 inalámbricos) y técnico de sonido durante el evento.',
    'PER_DAY', 'Día', 300000, 450000, 350000, 15.00, 25.00, 'ACTIVE', true, true, ARRAY['sonido', 'amplificacion', 'fiesta', 'corporativo']
),
(
    '10000000-0000-4000-c000-000000000002', 'c0000000-0000-4000-b000-000000000001', 'EQUIPMENT', 'AV-SND-002', 
    'DJ Setup Profesional (Pioneer DJ)', 'dj-setup-pioneer-pro',
    'Equipamiento estándar DJ de la industria. No incluye al DJ.',
    'Pack incluye 2x CDJ-3000 o CDJ-2000NXS2 y 1x Mixer DJM-900NXS2. Se entrega montado en mesa de DJ.',
    'PER_DAY', 'Set', 120000, 180000, 150000, 20.00, 30.00, 'ACTIVE', false, true, ARRAY['dj', 'pioneer', 'fiesta', 'musica']
),
(
    '10000000-0000-4000-c000-000000000003', 'c0000000-0000-4000-b000-000000000002', 'EQUIPMENT', 'AV-ILU-001', 
    'Pack Iluminación Perimetral (10 Focos LED)', 'iluminacion-perimetral-10-led',
    'Focos LED (Par) para teñir paredes y ambientar espacios architecturalmente.',
    'Pack de 10 focos LED Par 64 / Par 18x10W inalambricos o cableados. Controlados por DMX o fijos a solicitud de color. Ideales para cambiar la atmósfera del salón o toldo.',
    'FIXED', 'Pack', 80000, 120000, 95000, 20.00, 35.00, 'ACTIVE', false, true, ARRAY['iluminacion', 'ambiental', 'focos', 'led']
),
(
    '10000000-0000-4000-c000-000000000004', 'c0000000-0000-4000-b000-000000000002', 'EQUIPMENT', 'AV-ILU-002', 
    'Estructura Truss 4m con Cabezas Móviles', 'truss-4m-cabezas-moviles',
    'Estructura puente de aluminio con iluminación de pista dinámica.',
    'Truss de 4 metros lineales elevado mediante pedestales. Incluye 4 cabezas móviles tipo Spot/Beam, láser básico y máquina de humo. Técnico de iluminación incluido.',
    'PER_DAY', 'Estructura', 220000, 350000, 280000, 15.00, 25.00, 'ACTIVE', true, false, ARRAY['iluminacion', 'pista', 'fiesta', 'truss', 'robomatica']
),
(
    '10000000-0000-4000-c000-000000000005', 'c0000000-0000-4000-b000-000000000003', 'EQUIPMENT', 'AV-VID-001', 
    'Pantalla LED P3 Indoor (Metro Cuadrado)', 'pantalla-led-p3-indoor-m2',
    'Pantalla LED de alta resolución para interiores. Arriendo por metro cuadrado.',
    'Se arrienda por M2. Pitch 3.9 o 2.9 (Indoor). Incluye procesador de video NovaStar y estructuras auto-soportantes (hast 3m altura). No incluye VJ/Operador a menos que se solicite por separado.',
    'PER_SQM', 'M2', 45000, 65000, 55000, 10.00, 20.00, 'ACTIVE', true, false, ARRAY['led', 'video', 'pantalla', 'corporativo']
),

-- INFRASTRUCTURE
(
    '10000000-0000-4000-c000-000000000006', 'c0000000-0000-4000-b000-000000000004', 'EQUIPMENT', 'INF-TNT-001', 
    'Carpa Pabellón Translúcida (M2)', 'carpa-pabellon-translucida-m2',
    'Estructura de carpa tipo pabellón con laterales y techo transparente.',
    'Valor por metro cuadrado (M2). Carpa de estructura alemana de aluminio de gran formato. Incluye montaje. No incluye piso ni carpeta. Ideal para bodas y galas.',
    'PER_SQM', 'M2', 5500, 8500, 6500, 15.00, 25.00, 'ACTIVE', true, false, ARRAY['carpa', 'toldo', 'boda', 'outdoor']
),
(
    '10000000-0000-4000-c000-000000000007', 'c0000000-0000-4000-b000-000000000004', 'EQUIPMENT', 'INF-FLR-001', 
    'Piso de Madera Flotante / Entablado (M2)', 'piso-madera-entablado-m2',
    'Superficie de piso modular de madera para exteriores.',
    'Piso encastrado de terciado fenólico y estructuras para nivelación básica. Valor por m2 cubierto.',
    'PER_SQM', 'M2', 3500, 5500, 4500, 15.00, 25.00, 'ACTIVE', false, false, ARRAY['piso', 'infraestructura', 'madera']
),
(
    '10000000-0000-4000-c000-000000000008', 'c0000000-0000-4000-b000-000000000005', 'EQUIPMENT', 'INF-MOB-001', 
    'Silla Chiavari / Tiffany (Dorado/Blanco)', 'silla-chiavari-tiffany',
    'Silla clásica elegante, el estándar para bodas y galas sentadas.',
    'Silla de resina de alta resistencia tipo chiavari, con cojin de ecocuero. Valor unitario.',
    'PER_UNIT', 'Silla', 2000, 3500, 2500, 20.00, 40.00, 'ACTIVE', false, true, ARRAY['silla', 'mobiliario', 'cena', 'boda']
),
(
    '10000000-0000-4000-c000-000000000009', 'c0000000-0000-4000-b000-000000000005', 'EQUIPMENT', 'INF-MOB-002', 
    'Living Lounge Completo (10 personas)', 'living-lounge-ecocuero-10pax',
    'Set completo de living modular de ecocuero blanco.',
    'Incluye 2 sillones dobles o triple, 2 banquetas grandes dobles, 2 puf y 1 mesa de centro. Capacidad aproximada: 10 personas sentadas/apoyadas.',
    'FIXED', 'Living', 55000, 85000, 65000, 20.00, 35.00, 'ACTIVE', true, true, ARRAY['living', 'lounge', 'mobiliario', 'fiesta']
),

-- STAFF
(
    '10000000-0000-4000-c000-000000000010', 'c0000000-0000-4000-b000-000000000006', 'SERVICE', 'STF-PRO-001', 
    'Productor Técnico General (Turno 12h)', 'productor-tecnico-12h',
    'Especialista a cargo del montaje técnico y desarrollo logístico.',
    'Profesional dedicado a supervisar ingresos, montajes estructurales y AV, y desarrollo general (Stage Manager). Turno máximo de 12 horas consecutivas.',
    'PER_PERSON', 'Jornada', 120000, 250000, 150000, 10.00, 20.00, 'ACTIVE', true, false, ARRAY['productor', 'staff', 'coordinador']
),
(
    '10000000-0000-4000-c000-000000000011', 'c0000000-0000-4000-b000-000000000007', 'SERVICE', 'STF-SEC-001', 
    'Guardia de Seguridad Privada OS10 (Turno 8h)', 'guardia-os10-8h',
    'Personal certificado OS10 para control de acceso y rondas.',
    'Guardia con indumentaria completa negra o de traje (a definir). Capacitado en resolución pasiva de conflictos. Turno de recinto de 8 horas.',
    'PER_PERSON', 'Turno', 45000, 75000, 55000, 15.00, 25.00, 'ACTIVE', false, true, ARRAY['seguridad', 'guardia', 'control-acceso']
)
ON CONFLICT (code) DO NOTHING;

-- Populate basic platform_config just to have them available
INSERT INTO public.platform_config (key, value, description)
VALUES 
    ('GLOBAL_TAX_RATE', '{"percentage": 19, "country": "CL", "name": "IVA"}', 'Tasa de impuesto valor agregado'),
    ('MARGINGS_TIERS', '{"high_volume": 15, "standard": 25, "low_volume": 40}', 'Márgenes de comisión predeterminados por tipo de venta')
ON CONFLICT (key) DO NOTHING;

