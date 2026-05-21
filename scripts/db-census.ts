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

async function runCensus() {
    console.log('📊 DATABASE USER CENSUS\n');

    try {
        // 1. Get all profiles
        const { data: allProfiles, error: profileErr } = await supabase
            .from('profiles')
            .select('*');

        if (profileErr) throw profileErr;

        console.log(`📋 Total profiles in DB: ${allProfiles?.length || 0}`);
        
        const testProfiles = allProfiles?.filter(p => p.email.endsWith('@test.com')) || [];
        const realProfiles = allProfiles?.filter(p => !p.email.endsWith('@test.com')) || [];

        console.log(`🧪 Test profiles (@test.com): ${testProfiles.length}`);
        console.log(`✨ Real profiles (other domains): ${realProfiles.length}`);
        
        console.log('\n--- Real Profiles Detail ---');
        realProfiles.forEach(p => {
            console.log(`   - ID: ${p.id} | Email: ${p.email} | Name: ${p.name} | Role: ${p.role}`);
        });

        // 2. Fetch all auth users
        console.log('\n--- Auth Users Check ---');
        let page = 1;
        let allAuthUsers = [];
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
                allAuthUsers.push(...users);
                page++;
                if (users.length < 100) {
                    hasMore = false;
                }
            }
        }

        console.log(`🔐 Total users in auth.users: ${allAuthUsers.length}`);
        
        const testAuth = allAuthUsers.filter(u => u.email?.endsWith('@test.com'));
        const realAuth = allAuthUsers.filter(u => !u.email?.endsWith('@test.com'));

        console.log(`🧪 Test Auth Users: ${testAuth.length}`);
        console.log(`✨ Real Auth Users: ${realAuth.length}`);

        console.log('\n--- Real Auth Users Detail ---');
        realAuth.forEach(u => {
            console.log(`   - ID: ${u.id} | Email: ${u.email} | Role: ${u.app_metadata?.role || 'none'} | Created: ${u.created_at}`);
        });

        // 3. Find Orphans (Auth users without profile, or Profiles without Auth user)
        console.log('\n--- Orphan Analysis ---');
        const profileIds = new Set(allProfiles?.map(p => p.id) || []);
        const authIds = new Set(allAuthUsers.map(u => u.id));

        const authWithoutProfile = allAuthUsers.filter(u => !profileIds.has(u.id));
        const profileWithoutAuth = allProfiles?.filter(p => !authIds.has(p.id)) || [];

        console.log(`⚠️ Auth users with NO profile: ${authWithoutProfile.length}`);
        authWithoutProfile.forEach(u => {
            console.log(`   - Email: ${u.email} | ID: ${u.id}`);
        });

        console.log(`⚠️ Profiles with NO Auth user: ${profileWithoutAuth.length}`);
        profileWithoutAuth.forEach(p => {
            console.log(`   - Email: ${p.email} | ID: ${p.id}`);
        });

    } catch (error: any) {
        console.error('❌ Error during census:', error.message);
    }
}

runCensus();
