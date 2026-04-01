import { createClient } from '@supabase/supabase-js'

/**
 * Seed Data Script
 * 
 * Popula la base de datos con datos de desarrollo
 */

async function seed() {
  console.log('🌱 Starting database seed...')
  console.log()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ============================================
  // CLIENTS
  // ============================================

  console.log('👤 Seeding clients...')

  const clients = [
    {
      id: 'seed-client-001',
      name: 'María García',
      email: 'maria@empresa.com',
      phone: '+525512345678',
      role: 'client',
      company: 'TechCorp México',
      created_at: new Date().toISOString()
    },
    {
      id: 'seed-client-002',
      name: 'Carlos López',
      email: 'carlos@startup.io',
      phone: '+525598765432',
      role: 'client',
      company: 'StartupIO',
      created_at: new Date().toISOString()
    }
  ]

  const { error: clientsError } = await supabase
    .from('users')
    .upsert(clients, { onConflict: 'id' })

  if (clientsError) {
    console.log(`   ⚠️ Clients: ${clientsError.message}`)
  } else {
    console.log(`   ✅ ${clients.length} clients seeded`)
  }

  // ============================================
  // PROVIDERS
  // ============================================

  console.log('🔧 Seeding providers...')

  const providers = [
    {
      id: 'seed-provider-001',
      name: 'Premium Catering Co.',
      email: 'contact@premiumcatering.mx',
      phone: '+525511111111',
      role: 'provider',
      category: 'catering',
      expertise_level: 'premium',
      verified: true,
      rating: 4.8,
      completed_orders: 156,
      created_at: new Date().toISOString()
    }
  ]

  const { error: providersError } = await supabase
    .from('providers')
    .upsert(providers, { onConflict: 'id' })

  if (providersError) {
    console.log(`   ⚠️ Providers: ${providersError.message}`)
  } else {
    console.log(`   ✅ ${providers.length} providers seeded`)
  }

  console.log()
  console.log('═══════════════════════════════════════════')
  console.log('  🌱 Seed completed!')
  console.log('═══════════════════════════════════════════')
  console.log()
}

seed().catch(console.error)
