import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bxhlusdpmjldqbsdztyg.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is missing in env!');
    process.exit(1);
}

const supabase = createClient(url, key);

async function testQuery() {
    console.log('🔗 Querying Supabase for ai_providers...');
    const { data, error } = await supabase
        .from('ai_providers')
        .select('*');

    if (error) {
        console.error('❌ Error returned by Supabase:', error);
    } else {
        console.log('✅ Success! Data returned:', data);
    }
}

testQuery();
