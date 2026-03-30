/**
 * Seed Script: Create Landing Page Services
 * Run with: npx tsx scripts/seed-services.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const categories = [
    { name: 'Audio Profesional', slug: 'audio', icon: '🔊' },
    { name: 'Iluminación', slug: 'iluminacion', icon: '💡' },
    { name: 'Pantallas LED', slug: 'pantallas', icon: '🖥️' },
    { name: 'Escenarios & Truss', slug: 'escenarios', icon: '🏗️' },
];

const services = [
    {
        name: 'Pack Fiesta Full',
        slug: 'pack-fiesta-full',
        description: 'Audio + Iluminación básica para eventos de hasta 100 personas.',
        price_from: 250000,
        category_slug: 'audio',
        is_active: true,
    },
    {
        name: 'Pantalla LED 3x2m P3',
        slug: 'pantalla-led-3x2',
        description: 'Pantalla de alta definición indoor. Ideal conferencias.',
        price_from: 450000,
        category_slug: 'pantallas',
        is_active: true,
    },
    {
        name: 'Escenario 6x4m',
        slug: 'escenario-6x4',
        description: 'Tarima modular altura ajustable (60-100cm).',
        price_from: 300000,
        category_slug: 'escenarios',
        is_active: true,
    },
    {
        name: 'Pack Matrimonio Premium',
        slug: 'pack-matrimonio-premium',
        description: 'Audio, Iluminación, Pista LED y Generador. Servicio completo.',
        price_from: 1200000,
        category_slug: 'audio',
        is_active: true,
    },
    {
        name: 'DJ Profesional',
        slug: 'dj-profesional',
        description: 'Servicio de DJ con equipo profesional para todo tipo de eventos.',
        price_from: 180000,
        category_slug: 'audio',
        is_active: true,
    },
    {
        name: 'Sistemas Line Array',
        slug: 'sistemas-line-array',
        description: 'Sistemas de sonido profesional para eventos medianos y grandes.',
        price_from: 350000,
        category_slug: 'audio',
        is_active: true,
    },
    {
        name: 'Cabezas Móviles',
        slug: 'cabezas-moviles',
        description: 'Iluminación profesional con cabezas móviles para shows.',
        price_from: 150000,
        category_slug: 'iluminacion',
        is_active: true,
    },
    {
        name: 'Video Mapping',
        slug: 'video-mapping',
        description: 'Proyección de video mapping para fachadas y escenarios.',
        price_from: 800000,
        category_slug: 'pantallas',
        is_active: true,
    },
];

async function seed() {
    console.log('🌱 Starting seed...');

    // 1. Insert Categories
    console.log('📁 Creating categories...');
    for (const cat of categories) {
        const { data, error } = await supabase
            .from('categories')
            .upsert({ name: cat.name, slug: cat.slug, icon: cat.icon }, { onConflict: 'slug' })
            .select()
            .single();

        if (error) {
            console.error(`  ❌ Error creating category ${cat.name}:`, error.message);
        } else {
            console.log(`  ✅ Category: ${data.name} (${data.id})`);
        }
    }

    // 2. Fetch category IDs
    const { data: categoryData } = await supabase.from('categories').select('id, slug');
    const categoryMap = new Map(categoryData?.map(c => [c.slug, c.id]) || []);

    // 3. Insert Services
    console.log('📦 Creating services...');
    for (const svc of services) {
        const categoryId = categoryMap.get(svc.category_slug);
        if (!categoryId) {
            console.error(`  ❌ Category not found for: ${svc.name}`);
            continue;
        }

        const { data, error } = await supabase
            .from('services')
            .upsert(
                {
                    name: svc.name,
                    slug: svc.slug,
                    description: svc.description,
                    price_from: svc.price_from,
                    category_id: categoryId,
                    is_active: svc.is_active,
                },
                { onConflict: 'slug' }
            )
            .select()
            .single();

        if (error) {
            console.error(`  ❌ Error creating service ${svc.name}:`, error.message);
        } else {
            console.log(`  ✅ Service: ${data.name} - $${data.price_from}`);
        }
    }

    console.log('🎉 Seed complete!');
}

seed().catch(console.error);
