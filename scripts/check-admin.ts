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

async function setupAdmin() {
    const adminEmail = 'inversionsanagustin@gmail.com';
    const adminPassword = 'agustin123';
    const adminName = 'Administrador';

    console.log('🔧 Checking Admin Status\n');

    try {
        // Check profiles table
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .ilike('email', '%agustin%');

        if (profilesError) throw profilesError;

        console.log('📋 Profiles with "agustin":', profiles?.length || 0);
        if (profiles && profiles.length > 0) {
            profiles.forEach(p => {
                console.log(`   - ${p.email} | role: ${p.role} | id: ${p.id}`);
            });
        }

        // Check all profiles with admin role
        const { data: adminProfiles } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'ADMIN');

        console.log('\n👑 Admin profiles:', adminProfiles?.length || 0);
        if (adminProfiles) {
            adminProfiles.forEach(p => {
                console.log(`   - ${p.email} | id: ${p.id}`);
            });
        }

        // List first 5 auth users
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        console.log('\n🔐 First 5 auth users:');
        authUsers?.users.slice(0, 5).forEach(u => {
            console.log(`   - ${u.email}`);
        });

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

setupAdmin();
