import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.production.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const encryptionKey = process.env.ENCRYPTION_KEY;

console.log('--- DIAGNÓSTICO DE BLACKBOX.AI ---');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key Configurada:', serviceKey ? 'Sí' : 'No');
console.log('Encryption Key Configurada:', encryptionKey ? 'Sí' : 'No');

if (!supabaseUrl || !serviceKey) {
  console.error('Faltan variables de entorno de Supabase.');
  process.exit(1);
}

function decrypt(cipherText: string, key: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error('Error desencriptando:', err);
    return cipherText;
  }
}

async function test() {
  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('\nObteniendo proveedor blackbox desde la BD...');
  const { data: provider, error } = await supabase
    .from('ai_providers')
    .select('*')
    .eq('slug', 'blackbox')
    .single();

  if (error) {
    console.error('Error obteniendo proveedor de la BD:', error.message);
    process.exit(1);
  }

  console.log('Proveedor encontrado:', provider.name);
  console.log('Modelo por defecto actual:', provider.default_model);
  console.log('¿Está activo?:', provider.is_active ? 'Sí' : 'No');

  if (!provider.api_key) {
    console.error('No hay API Key configurada para Blackbox.');
    process.exit(1);
  }

  if (!encryptionKey) {
    console.error('No se puede desencriptar la API Key porque ENCRYPTION_KEY no está configurada.');
    process.exit(1);
  }

  const decryptedKey = decrypt(provider.api_key, encryptionKey);
  console.log('API Key desencriptada (primeros 6 caracteres):', decryptedKey.substring(0, 6) + '...');

  console.log('\nConsultando modelos disponibles en Blackbox.ai...');
  try {
    const response = await fetch('https://api.blackbox.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${decryptedKey}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Error de Blackbox API (${response.status}):`, text);
      return;
    }

    const data = await response.json();
    console.log('Modelos retornados por tu clave de API:');
    if (data && Array.isArray(data.data)) {
      data.data.forEach((model: any) => {
        console.log(`- ID: ${model.id} (${model.name || 'Sin nombre'})`);
      });
    } else if (data && Array.isArray(data)) {
      data.forEach((model: any) => {
        console.log(`- ID: ${model.id} (${model.name || 'Sin nombre'})`);
      });
    } else {
      console.log('Respuesta de modelos:', JSON.stringify(data, null, 2));
    }
  } catch (err: any) {
    console.error('Error consultando modelos:', err.message);
  }
}

test();
