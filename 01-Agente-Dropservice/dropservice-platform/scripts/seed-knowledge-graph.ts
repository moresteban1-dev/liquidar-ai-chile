import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedKnowledgeGraph() {
  console.log('🧠 Seeding Knowledge Graph Foundations (Event Config Engine)');
  console.log('============================================================\n');

  // 1. EVENT TYPES
  console.log('📋 Creating Event Types...');
  const eventTypes = [
    {
      id: "a1111111-1111-1111-1111-111111111111",
      code: "CORP_CONV",
      name: "Convención Corporativa",
      description: "Evento corporativo de día completo, requiere conferencias, catering y audiovisual.",
      base_category: "CORPORATIVE"
    },
    {
      id: "a2222222-2222-2222-2222-222222222222",
      code: "SOC_WEDDING",
      name: "Matrimonio Premium",
      description: "Evento social de alta complejidad, cena de multiples tiempos, banda en vivo.",
      base_category: "SOCIAL"
    }
  ];

  for (const et of eventTypes) {
    const { error } = await supabase.from('event_types').upsert(et, { onConflict: 'code' });
    if (error) console.error(`❌ Failed to seed event type ${et.code}:`, error.message);
  }

  // 2. SERVICE NODES
  console.log('🧩 Creating Service Nodes (Abstract Services)...');
  const serviceNodes = [
    {
      id: "b1111111-1111-1111-1111-111111111111",
      code: "STAGE_MODULE",
      name: "Módulo Escenario 2x2m",
      description: "Tarima estándar para oradores o bandas.",
      node_type: "EQUIPMENT",
      is_essential: true
    },
    {
      id: "b2222222-2222-2222-2222-222222222222",
      code: "PA_SYSTEM_500",
      name: "Sistema PA hasta 500 personas",
      description: "Audio general y micrófonos básicos.",
      node_type: "EQUIPMENT",
      is_essential: true
    },
    {
      id: "b3333333-3333-3333-3333-333333333333",
      code: "CATERING_LUNCH_3COURSES",
      name: "Almuerzo Plated 3 Tiempos",
      description: "Entrada, Plato principal y Postre.",
      node_type: "SERVICE",
      is_essential: false
    },
    {
      id: "b4444444-4444-4444-4444-444444444444",
      code: "VIP_RESTROOMS",
      name: "Baños VIP Trailer",
      description: "Trailer climatizado con lavamanos.",
      node_type: "EQUIPMENT",
      is_essential: false
    }
  ];

  for (const node of serviceNodes) {
    const { error } = await supabase.from('service_nodes').upsert(node, { onConflict: 'code' });
    if (error) console.error(`❌ Failed to seed service node ${node.code}:`, error.message);
  }

  // 3. EVENT TYPE MAPPINGS
  console.log('🔗 Mapping Nodes to Event Types...');
  const mappings = [
    {
      event_type_id: "a1111111-1111-1111-1111-111111111111", // Convencion
      service_node_id: "b1111111-1111-1111-1111-111111111111", // Escenario
      priority: 1
    },
    {
      event_type_id: "a1111111-1111-1111-1111-111111111111", 
      service_node_id: "b2222222-2222-2222-2222-222222222222", // PA System
      priority: 1
    }
  ];

  for (const map of mappings) {
    const { error } = await supabase.from('event_type_node_mappings').upsert(map, { onConflict: 'event_type_id, service_node_id' });
    if (error) console.error(`❌ Failed to seed mapping:`, error.message);
  }

  // 4. DEPENDENCIES (The Magic)
  console.log('🕸️ Establishing Topological Dependencies...');
  const deps = [
    {
      source_node_id: "b2222222-2222-2222-2222-222222222222", // PA System
      target_node_id: "b1111111-1111-1111-1111-111111111111", // Stage (recommends stage if there's audio)
      dependency_type: "RECOMMENDS",
      reasoning: "Genera visibilidad óptima para los presentadores."
    }
  ];

  for (const dep of deps) {
    const { error } = await supabase.from('service_dependencies').upsert(dep, { onConflict: 'source_node_id, target_node_id, dependency_type' });
    if (error) console.error(`❌ Failed to seed dependency:`, error.message);
  }

  // 5. SCALING RULES
  console.log('📈 Setting up Scaling Rules...');
  const rules = [
    {
      service_node_id: "b4444444-4444-4444-4444-444444444444", // Baños VIP
      rule_type: "STEP",
      parameter_target: "ATTENDEES",
      base_quantity: 1,
      divisor: 150, // 1 baño cada 150 personas
      max_quantity: 10
    }
  ];

  for (const rule of rules) {
    const { error } = await supabase.from('scaling_rules').upsert(rule, { onConflict: 'id' });
    if (error) console.error(`❌ Failed to seed scaling rule:`, error.message);
  }

  console.log('\n✅ Knowledge Graph base seed complete!');
}

seedKnowledgeGraph().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
