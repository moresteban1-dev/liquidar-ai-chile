
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Simulate the API Route 'createApiClient' environment
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function testAnonAdminAccess() {
    console.log('🧪 Testing Admin Access with Anon Client...');
    try {
        const email = `test_anon_${Date.now()}@fail.com`;
        // This should FAIL
        const { data, error } = await anonClient.auth.admin.createUser({
            email,
            password: 'password123',
            email_confirm: true
        });

        if (error) {
            console.log('✅ EXPECTED ERROR:', error.message);
            console.log('   (Anon client cannot create users via admin API)');
        } else {
            console.error('❌ UNEXPECTED SUCCESS: Anon client created a user!', data);
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.log('✅ EXPECTED EXCEPTION:', message);
    }
}

testAnonAdminAccess();
