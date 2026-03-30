import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Fix for __dirname in ESM if needed, but process.cwd() is easier relative to root
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Reading .env from: ${envPath}`);

const envVars: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envVars[key.trim()] = value.trim().replace(/"/g, '').replace(/'/g, '');
        }
    });
} else {
    console.warn("Warning: .env file not found at root.");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envVars['SUPABASE_SERVICE_ROLE_KEY'];

console.log('--- Env Debug ---');
console.log('Keys in .env:', Object.keys(envVars));
console.log('Auth check: URL present?', !!supabaseUrl, 'Key present?', !!supabaseServiceKey);
console.log('-----------------');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USERS = [
    { email: 'admin@eventhub.cl', password: 'password123', role: 'ADMIN', name: 'Súper Admin' },
    { email: 'proveedor@eventhub.cl', password: 'password123', role: 'PROVEEDOR', name: 'Proveedor Demo' },
    { email: 'cliente@eventhub.cl', password: 'password123', role: 'CLIENTE', name: 'Cliente Demo' },
];

async function createUsers() {
    console.log('🚀 Creating Test Users...');

    for (const u of USERS) {
        process.stdout.write(`• Processing ${u.role} (${u.email})... `);

        // 1. Check if user exists (List is better than create-fail for logs)
        const { data: { users } } = await supabase.auth.admin.listUsers();
        let userId = users.find(user => user.email === u.email)?.id;

        if (!userId) {
            const { data, error } = await supabase.auth.admin.createUser({
                email: u.email,
                password: u.password,
                email_confirm: true,
                user_metadata: { full_name: u.name }
            });
            if (error) {
                console.log(`❌ Auth Error: ${error.message}`);
                continue;
            }
            userId = data.user?.id;
        } else {
            // Update password
            await supabase.auth.admin.updateUserById(userId, { password: u.password });
        }

        if (!userId) continue;

        // 2. Upsert Profile
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: userId,
            email: u.email,
            name: u.name,
            role: u.role
        }, { onConflict: 'id' });

        if (profileError) console.log(`❌ Profile Error: ${profileError.message}`);

        // 3. Provider Profile
        if (u.role === 'PROVEEDOR') {
            await supabase.from('provider_profiles').upsert({
                user_id: userId,
                specialty: 'General',
                rating: 5.0,
                is_active: true
            }, { onConflict: 'user_id' });
        }
        console.log('✅ OK');
    }
    console.log('\n✨ Done. Password: password123');
}

createUsers();
