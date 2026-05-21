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

async function debugUser() {
    console.log(`🔍 Broader search for "esteban" or similar across profiles & auth.users\n`);

    try {
        // 1. Search in public.profiles table
        console.log('--- Search in public.profiles (email / name containing "esteban" or "moresteban") ---');
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .or('email.ilike.%esteban%,name.ilike.%esteban%');

        if (profileError) {
            console.error('❌ Error reading profiles:', profileError.message);
        } else if (profiles && profiles.length > 0) {
            console.log(`✅ Profiles found:`);
            profiles.forEach(p => {
                console.log(`   ID: ${p.id} | Email: ${p.email} | Name: ${p.name} | Role: ${p.role}`);
            });
        } else {
            console.log(`❌ No profiles containing "esteban" found in public.profiles.`);
        }

        // 2. Fetch all users from auth.users (paginated) to see if we can find the email
        console.log('\n--- Searching auth.users by paging ---');
        let page = 1;
        let foundUsers = [];
        let hasMore = true;

        while (hasMore) {
            const { data: { users }, error } = await supabase.auth.admin.listUsers({
                page: page,
                perPage: 100
            });

            if (error) {
                console.error(`❌ Error listing page ${page}:`, error.message);
                break;
            }

            if (!users || users.length === 0) {
                hasMore = false;
            } else {
                const matches = users.filter(u => 
                    u.email?.toLowerCase().includes('esteban')
                );
                foundUsers.push(...matches);
                page++;
                if (users.length < 100) {
                    hasMore = false;
                }
            }
        }

        if (foundUsers.length > 0) {
            console.log(`✅ Users found in auth.users containing "esteban":`);
            foundUsers.forEach(u => {
                console.log(`   ID: ${u.id} | Email: ${u.email} | Created: ${u.created_at}`);
            });
        } else {
            console.log(`❌ No auth users containing "esteban" found in auth.users.`);
        }

    } catch (error: any) {
        console.error('❌ Unexpected Error during diagnostic:', error);
    }
}

debugUser();
