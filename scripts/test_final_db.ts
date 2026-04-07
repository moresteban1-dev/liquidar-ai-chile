import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
    console.log('--- DB AUTH CHECK (DIRECT) ---');
    console.log('URL:', supabaseUrl);
    
    const users = ['admin@eventhub.cl', 'cliente@eventhub.cl', 'proveedor@eventhub.cl'];
    
    for (const email of users) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: 'password123'
        });
        
        if (error) {
            console.log(`❌ Login FAILED for ${email}: ${error.message}`);
        } else {
            console.log(`✅ Login SUCCESS for ${email}! ID: ${data.user?.id}`);
        }
    }
}

testAuth();
