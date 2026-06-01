import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.production.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Faltan variables de entorno de Supabase.');
  process.exit(1);
}

async function run() {
  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('Actualizando modelo por defecto de Blackbox.ai en la BD...');
  const { data, error } = await supabase
    .from('ai_providers')
    .update({ default_model: 'blackboxai/blackbox-pro' })
    .eq('slug', 'blackbox')
    .select();

  if (error) {
    console.error('Error actualizando la base de datos:', error.message);
    process.exit(1);
  }

  console.log('¡Actualización exitosa! Registro actualizado:', data);
}

run();
