
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// We use Service Key to simulate "backend logic" but for auth, we should test public sign up if possible?
// Actually simpler to test the API route logic by calling it via fetch? 
// Or just use the client sdk with anon key for the auth part to simulate real user.
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simulateClientFlow() {
    console.log('🚀 Starting Client Flow Simulation...');

    const clientEmail = `client_${Date.now()}@test.com`;
    const clientPassword = 'password123';
    const clientName = 'Test Client';

    try {
        // 1. REGISTER (Simulating the API call the frontend makes)
        // Since we fixed the frontend to call /api/auth/register, we mimic that here.
        // Ideally we'd validte the API endpoint itself, but here we can simulate 
        // what the API does or just call the API if running? 
        // We are running this as a script, so no local server guaranteed.
        // We will use the Supabase Service Admin to Create User + Profile directly
        // mimicking exactly what the /api/auth/register route does now.

        // Actually, to test the Role logic, let's verify if a standard signUp fails (it should have no role)
        // And if our API logic works.

        console.log(`1. creating Client ${clientEmail}...`);

        // We'll mimic the API logic manually here since we can't fetch localhost easily if not running.
        // NOTE: This confirms the LOGIC, though not the ENDPOINT connectivity.

        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // Create User
        const { data: user, error: createError } = await adminClient.auth.admin.createUser({
            email: clientEmail,
            password: clientPassword,
            email_confirm: true,
            user_metadata: { full_name: clientName }
        });

        if (createError) throw createError;
        const userId = user.user!.id;
        console.log(`   User created: ${userId}`);

        // Create Profile (Client Role)
        const { error: profileError } = await adminClient
            .from('profiles')
            .insert({
                id: userId,
                email: clientEmail,
                name: clientName,
                role: 'CLIENTE'
            });

        if (profileError) throw profileError;
        console.log('   Profile created with CLIENTE role.');

        // 2. LOGIN (As the new client)
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: clientEmail,
            password: clientPassword
        });

        if (loginError) throw loginError;
        console.log('2. Client Logged In successfully.');

        // 3. CREATE QUOTATION
        console.log('3. Submitting Quotation...');

        // Fetch a valid Service ID first
        const { data: service } = await supabase.from('services').select('id').limit(1).single();
        const serviceId = service?.id; // If null, might fail foreign key constraint if strict, but we'll try.

        const quoteData = {
            client_id: userId,
            service_id: serviceId, // Use correct FK column
            // category_id: 'audio', // REMOVED: Not in schema
            event_start_date: new Date().toISOString(), // Renamed to match schema snake_case? No, API uses camelCase mapping usually? 
            // Wait, the API route uses `event_start_date`. The script uses `supabase` client which expects snake_case if typing is generated or manual.
            // Let's assume snake_case for DB columns.
            event_location: 'Santiago Centro',
            brief: 'Test Event Quotation from script', // mapped to brief
            public_status: 'RECIBIDA', // mapped to public_status
            code: `QUO-TEST-${Date.now()}` // Generate a code
        };

        // Simulate what the API does: Insert as Admin/Service Role
        const { data: quote, error: quoteError } = await adminClient
            .from('quotations')
            .insert(quoteData)
            .select()
            .single();

        if (quoteError) throw quoteError;
        console.log(`   Quotation created (by Admin/API). ID: ${quote.id}`);

        // 4. VERIFY ACCESS (As Client)
        // Client should be able to SEE this quotation now.
        const { data: clientQuotes, error: fetchError } = await supabase
            .from('quotations')
            .select('id')
            .eq('id', quote.id);

        if (fetchError) throw fetchError;
        if (clientQuotes.length === 0) throw new Error('Client cannot see their own quotation via RLS');

        console.log('   Client successfully fetched their quotation.');

        console.log('✅ CLIENT FLOW PASSED');

    } catch (error) {
        console.error('❌ Client Flow Failed:', error);
    }
}

async function simulateProviderFlow() {
    console.log('\n🚀 Starting Provider Flow Simulation...');

    const providerEmail = `provider_${Date.now()}@test.com`;
    const providerPassword = 'password123';
    const providerName = 'Test Provider';

    try {
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Register
        const { data: user } = await adminClient.auth.admin.createUser({
            email: providerEmail,
            password: providerPassword,
            email_confirm: true,
            user_metadata: { full_name: providerName }
        });

        const userId = user.user!.id;

        // Create Profile (Provider Role)
        await adminClient.from('profiles').insert({
            id: userId,
            email: providerEmail,
            name: providerName,
            role: 'PROVEEDOR'
        });

        // Create Provider Profile
        await adminClient.from('provider_profiles').insert({
            user_id: userId,
            is_active: true
        });

        console.log('1. Provider Profile & Record created.');

        // 2. Login
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: providerEmail,
            password: providerPassword
        });

        if (loginError) throw loginError;
        console.log('2. Provider Logged In successfully.');

        console.log('✅ PROVIDER FLOW PASSED');

    } catch (error) {
        console.error('❌ Provider Flow Failed:', error);
    }
}

async function simulateAdminFlow() {
    console.log('\n🚀 Starting Admin Flow Simulation...');

    const adminEmail = 'admin@eventhub.cl';
    const adminPassword = 'admin-password-2026'; // From seed_admin.ts

    try {
        // 1. Login as Admin
        const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
            email: adminEmail,
            password: adminPassword
        });

        if (loginError) throw loginError;
        if (!session) throw new Error('No session returned for Admin');

        console.log('1. Admin Logged In successfully.');

        // 2. Access Admin Data (All Quotations)
        // RLS should allow Admin to seeing everything.
        // We use the anon client BUT with the authenticated admin session.

        const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            }
        });

        const { count, error: listError } = await adminClient
            .from('quotations')
            .select('*', { count: 'exact', head: true });

        if (listError) throw listError;

        console.log(`2. Admin accessed quotations table. Total rows: ${count}`);

        console.log('✅ ADMIN FLOW PASSED');

    } catch (error) {
        console.error('❌ Admin Flow Failed:', error);
    }
}

(async () => {
    await simulateClientFlow();
    await simulateProviderFlow();
    await simulateAdminFlow();
})();
