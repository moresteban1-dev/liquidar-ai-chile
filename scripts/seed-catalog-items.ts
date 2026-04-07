/**
 * Seed Catalog Items — Población de ítems de prueba para el catálogo maestro V2
 * 
 * Crea ítems vinculados a las categorías reales de `catalog_categories` 
 * para verificar el flujo E2E Landing → Wizard → Cotización.
 * 
 * Ejecución: npx tsx scripts/seed-catalog-items.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan variables: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/** Ítems de prueba vinculados a categorías reales del catálogo maestro */
const SEED_ITEMS = [
    // Audiovisual y Técnico (CAT-AV)
    {
        id: 'i0000000-0000-4000-a000-000000000001',
        category_id: 'c0000000-0000-4000-a000-000000000001',
        name: 'Sistema de Sonido Line Array JBL VTX',
        slug: 'sonido-line-array-jbl-vtx',
        code: 'SRV-AV-001',
        description: 'Sistema profesional de sonido Line Array con procesamiento digital. Ideal para eventos de 200 a 5.000 personas. Incluye subwoofers, procesador y cableado.',
        item_type: 'SERVICE',
        status: 'ACTIVE',
        price_suggested: 850000,
        price_reference_min: 650000,
        price_reference_max: 1200000,
        unit_label: 'evento',
        is_featured: true,
        display_order: 10,
        tags: ['sonido', 'line-array', 'profesional'],
        metadata: {},
    },
    // Sonido y Amplificación (CAT-AV-SND)
    {
        id: 'i0000000-0000-4000-a000-000000000002',
        category_id: 'c0000000-0000-4000-b000-000000000001',
        name: 'Monitoreo de Escenario Wedge + IEM',
        slug: 'monitoreo-escenario-wedge-iem',
        code: 'SRV-SND-001',
        description: 'Sistema de retorno de escenario con monitores wedge de 12" y transmisores inalámbricos In-Ear. Para bandas y artistas en vivo.',
        item_type: 'SERVICE',
        status: 'ACTIVE',
        price_suggested: 350000,
        price_reference_min: 250000,
        price_reference_max: 500000,
        unit_label: 'evento',
        is_featured: false,
        display_order: 11,
        tags: ['monitoreo', 'iem', 'escenario'],
        metadata: {},
    },
    // Iluminación (CAT-AV-ILU)
    {
        id: 'i0000000-0000-4000-a000-000000000003',
        category_id: 'c0000000-0000-4000-b000-000000000002',
        name: 'Pack Iluminación Decorativa LED RGB',
        slug: 'iluminacion-decorativa-led-rgb',
        code: 'SRV-ILU-001',
        description: 'Kit de 20 focos PAR LED RGBW con control DMX inalámbrico. Perfecto para ambientación de eventos corporativos, matrimonios y galas.',
        item_type: 'EQUIPMENT',
        status: 'ACTIVE',
        price_suggested: 280000,
        price_reference_min: 200000,
        price_reference_max: 400000,
        unit_label: 'kit',
        is_featured: true,
        display_order: 12,
        tags: ['iluminación', 'led', 'decorativa', 'dmx'],
        metadata: {},
    },
    // Pantallas y Video (CAT-AV-VID)
    {
        id: 'i0000000-0000-4000-a000-000000000004',
        category_id: 'c0000000-0000-4000-b000-000000000003',
        name: 'Pantalla LED Indoor P3.9 (3x2m)',
        slug: 'pantalla-led-indoor-p39',
        code: 'SRV-VID-001',
        description: 'Pantalla LED modular de alta resolución P3.9mm, ensamblada en 3x2 metros. Incluye procesador de video, estructura y operador técnico.',
        item_type: 'EQUIPMENT',
        status: 'ACTIVE',
        price_suggested: 950000,
        price_reference_min: 750000,
        price_reference_max: 1500000,
        unit_label: 'unidad',
        is_featured: true,
        display_order: 13,
        tags: ['pantalla', 'led', 'video', 'indoor'],
        metadata: {},
    },
    // Carpas y Toldos (CAT-INF-TENT)
    {
        id: 'i0000000-0000-4000-a000-000000000005',
        category_id: 'c0000000-0000-4000-b000-000000000004',
        name: 'Carpa Estructural 10x20m con Piso',
        slug: 'carpa-estructural-10x20',
        code: 'SRV-TENT-001',
        description: 'Carpa estructural profesional de 200m² con piso de madera, iluminación perimetral y cortinas laterales transparentes. Para 150-200 personas.',
        item_type: 'EQUIPMENT',
        status: 'ACTIVE',
        price_suggested: 2500000,
        price_reference_min: 1800000,
        price_reference_max: 3500000,
        unit_label: 'evento',
        is_featured: true,
        display_order: 20,
        tags: ['carpa', 'estructura', 'outdoor'],
        metadata: {},
    },
    // Mobiliario Lounge (CAT-INF-FURN)
    {
        id: 'i0000000-0000-4000-a000-000000000006',
        category_id: 'c0000000-0000-4000-b000-000000000005',
        name: 'Set Lounge Premium (Sofás + Mesas)',
        slug: 'set-lounge-premium',
        code: 'SRV-FURN-001',
        description: 'Set completo de mobiliario lounge: 2 sofás de 3 cuerpos, 4 poltronas, 2 mesas de centro y 2 mesas auxiliares. Tapizado blanco premium.',
        item_type: 'EQUIPMENT',
        status: 'ACTIVE',
        price_suggested: 450000,
        price_reference_min: 350000,
        price_reference_max: 600000,
        unit_label: 'set',
        is_featured: false,
        display_order: 22,
        tags: ['mobiliario', 'lounge', 'premium'],
        metadata: {},
    },
    // Productores y Coordinadores (CAT-STAFF-PROD)
    {
        id: 'i0000000-0000-4000-a000-000000000007',
        category_id: 'c0000000-0000-4000-b000-000000000006',
        name: 'Productor Ejecutivo de Eventos',
        slug: 'productor-ejecutivo-eventos',
        code: 'SRV-PROD-001',
        description: 'Productor profesional con +10 años de experiencia. Coordina proveedores, gestiona timeline operativo y supervisa montaje/desmontaje completo.',
        item_type: 'SERVICE',
        status: 'ACTIVE',
        price_suggested: 600000,
        price_reference_min: 450000,
        price_reference_max: 800000,
        unit_label: 'jornada',
        is_featured: true,
        display_order: 31,
        tags: ['productor', 'coordinador', 'staff'],
        metadata: {},
    },
    // Seguridad (CAT-STAFF-SEC)
    {
        id: 'i0000000-0000-4000-a000-000000000008',
        category_id: 'c0000000-0000-4000-b000-000000000007',
        name: 'Equipo de Seguridad Perimetral (4 guardias)',
        slug: 'seguridad-perimetral-4-guardias',
        code: 'SRV-SEC-001',
        description: 'Equipo de 4 guardias de seguridad profesional con radios, control de acceso y reportes en tiempo real. Jornada de 12 horas.',
        item_type: 'SERVICE',
        status: 'ACTIVE',
        price_suggested: 480000,
        price_reference_min: 380000,
        price_reference_max: 600000,
        unit_label: 'jornada',
        is_featured: false,
        display_order: 32,
        tags: ['seguridad', 'guardias', 'acceso'],
        metadata: {},
    },
];

async function seedCatalogItems() {
    console.log('🏛️ Dropservice — Seed de Ítems del Catálogo Maestro V2');
    console.log('='.repeat(60));
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Ítems a insertar: ${SEED_ITEMS.length}`);
    console.log('');

    // Verificar que las categorías existen
    const { data: categories, error: catError } = await supabase
        .from('catalog_categories')
        .select('id, name')
        .order('display_order');

    if (catError) {
        console.error('❌ Error consultando categorías:', catError.message);
        process.exit(1);
    }

    console.log(`✅ Categorías encontradas: ${categories?.length}`);
    categories?.forEach(c => console.log(`   📂 ${c.name} (${c.id.substring(0, 8)}...)`));
    console.log('');

    // Upsert de ítems (INSERT o UPDATE si ya existen)
    for (const item of SEED_ITEMS) {
        const { error } = await supabase
            .from('catalog_items')
            .upsert(item, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Error insertando "${item.name}":`, error.message);
        } else {
            console.log(`✅ ${item.code} — ${item.name}`);
        }
    }

    console.log('');
    console.log('='.repeat(60));

    // Verificar conteo final
    const { count } = await supabase
        .from('catalog_items')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

    console.log(`🏆 Total ítems activos en catálogo: ${count}`);
    console.log('🚀 Seeding completado exitosamente.');
}

seedCatalogItems().catch(console.error);
