import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    try {
        console.log('Querying catalog_items...');
        const { data, error } = await supabase
            .from('catalog_items')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error querying catalog_items:', error);
            return;
        }

        console.log('Successfully queried! First item:');
        console.log(JSON.stringify(data, null, 2));

        // Let's also check catalog_categories
        console.log('\nQuerying catalog_categories...');
        const { data: catData, error: catError } = await supabase
            .from('catalog_categories')
            .select('*')
            .limit(1);

        if (catError) {
            console.error('Error querying catalog_categories:', catError);
            return;
        }

        console.log('Successfully queried! First category:');
        console.log(JSON.stringify(catData, null, 2));

    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

inspect();
