import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedProduction() {
  console.log('🌱 Seeding Production Data (Supabase)');
  console.log('=====================================\n');

  // 1. Create Sample Categories (Using catalog_categories for V2)
  console.log('📂 Creating service categories...');
  const categories = [
    {
      id: uuidv4(),
      name: 'Producción de Eventos',
      slug: 'produccion-eventos',
      description: 'Servicios integrales de producción de eventos',
      metadata: { icon: '🎭', color: '#FF6B6B' },
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Catering y Gastronomía',
      slug: 'catering-gastronomia',
      description: 'Servicios de alimentación y bebidas',
      metadata: { icon: '🍽️', color: '#4ECDC4' },
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Técnica y Sonido',
      slug: 'tecnica-sonido',
      description: 'Equipamiento técnico y audiovisual',
      metadata: { icon: '🎚️', color: '#95E1D3' },
      is_active: true
    }
  ];

  for (const cat of categories) {
    const { error } = await supabase.from('catalog_categories').upsert(cat, { onConflict: 'slug' });
    if (error) console.error(`   ❌ Failed to create category ${cat.name}:`, error.message);
  }
  console.log(`   ✅ Checked/Created ${categories.length} categories`);

  // 2. Create Sample Services (catalog_items)
  console.log('\n🛠️  Creating services...');
  const { data: catData } = await supabase.from('catalog_categories').select('id').eq('slug', 'produccion-eventos').single();
  
  if (catData) {
    const service = {
        id: uuidv4(),
        category_id: catData.id,
        name: 'Convención Empresarial',
        description: 'Organización completa de convenciones corporativas',
        base_price: 150000,
        currency: 'MXN',
        is_active: true,
        pricing_model: 'FIXED'
    };
    const { error } = await supabase.from('catalog_items').upsert(service, { onConflict: 'id' });
    if (error) {
       console.error(`   ❌ Failed to create service:`, error.message);
    } else {
       console.log('   ✅ Sample services created');
    }
  }

  // Admin user check
  console.log('\n👤 Checking Admin User setup...');
  const { data: adminUsers } = await supabase.from('users').select('id, email').eq('role', 'admin').limit(1);
  if (adminUsers && adminUsers.length > 0) {
      console.log(`   ✅ Admin user found: ${adminUsers[0].email}`);
  } else {
      console.log('   ⚠️  No admin user found. Create one through the Supabase Authentication dashboard.');
  }

  console.log('\n✅ Production seeding completed!');
}

seedProduction()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  });
