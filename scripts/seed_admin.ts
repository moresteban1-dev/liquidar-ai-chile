
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmin() {
    console.log('🌱 Seeding Admin User...');

    const adminEmail = 'admin@eventhub.cl';
    const adminPassword = 'admin-password-2026';
    const adminName = 'Súper Admin';

    try {
        // 1. Create User
        const { data: user, error: createError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { full_name: adminName }
        });

        if (createError) {
            if (createError.message.includes('already registered')) {
                console.log('Admin already exists. Skipping creation.');
                // Fetch existing to ensure role
                // Not strictly necessary if we just rely on "it's there"
                return;
            }
            throw createError;
        }

        if (!user.user) throw new Error('User creation returned null');

        console.log(`User created: ${user.user.id}`);

        // 2. Create Profile with ADMIN role
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: user.user.id,
                email: adminEmail,
                name: adminName,
                role: 'ADMIN' // Explicitly set ADMIN role
            });

        if (profileError) {
            // If profile exists (maybe partial delete?), update it
            if (profileError.code === '23505') { // Unique violation
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ role: 'ADMIN' })
                    .eq('id', user.user.id);
                if (updateError) throw updateError;
                console.log('Admin profile updated.');
            } else {
                throw profileError;
            }
        } else {
            console.log('Admin profile created.');
        }

        console.log('✅ Admin Seeded Successfully.');
        console.log(`Credentials: ${adminEmail} / ${adminPassword}`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}

seedAdmin();
