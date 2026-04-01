import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalizeAdmin() {
    console.log('🔧 Finalizing Admin User\n');

    // The user ID from previous signup
    const userId = '19b30d33-d45b-47de-ae46-ed0df4286643';
    const adminEmail = 'inversionsanagustin@gmail.com';
    const adminName = 'Administrador';

    try {
        // 1. Verify user exists in auth
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (userError || !user?.user) {
            console.log('⚠️  User not found in auth, checking...');
            
            // List users to find
            const { data: users } = await supabase.auth.admin.listUsers();
            const found = users?.users.find(u => u.email === adminEmail);
            
            if (found) {
                console.log('✅ Found user:', found.id);
                await createProfile(found.id);
            } else {
                console.log('❌ User not found anywhere');
            }
            return;
        }

        console.log('✅ User found:', user.user.id);
        await createProfile(user.user.id);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }

    async function createProfile(uid: string) {
        console.log('📝 Creating profile for:', uid);

        // Try to create/update profile
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: uid,
                email: adminEmail,
                name: adminName,
                role: 'ADMIN'
            }, { onConflict: 'id' });

        if (profileError) {
            console.log('❌ Profile error:', profileError.message);
        } else {
            console.log('✅ Profile created with ADMIN role');
            
            console.log('\n🎉 Admin Ready!');
            console.log('===========================================');
            console.log('URL:  http://localhost:3000/login');
            console.log('User: inversionsanagustin@gmail.com');
            console.log('Pass: agustin123');
            console.log('===========================================');
        }
    }
}

finalizeAdmin();
