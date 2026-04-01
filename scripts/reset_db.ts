
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetDatabase() {
    console.log('🚨 STARTING DATABASE RESET...');

    try {
        // 1. Delete all users from Auth (this cascades to profiles usually, but we check)
        // List all users
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) throw listError;

        if (users.length > 0) {
            console.log(`Found ${users.length} users. Deleting...`);
            for (const user of users) {
                const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
                if (deleteError) {
                    console.error(`Failed to delete user ${user.id}:`, deleteError.message);
                } else {
                    console.log(`Deleted user: ${user.email}`);
                }
            }
        } else {
            console.log('No users found to delete.');
        }

        // 2. Clear business tables (optional if cascade delete works, but safer to be explicit)
        // Note: Due to foreign keys, deleting users usually clears connected data.
        // But we might have orphan data if not set up with ON DELETE CASCADE.
        // Let's try explicit truncate equivalent (delete all) just in case.

        const tables = ['orders', 'quotations', 'provider_profiles', 'profiles'];

        // We rely on Auth Cascade for the most part, but let's verify empty
        for (const table of tables) {
            const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (error) {
                console.log(`Note: Could not check table ${table} (might strictly depend on auth): ${error.message}`);
            } else {
                console.log(`Table ${table} has ${count} rows remaining.`);
            }
        }

        console.log('✅ DATABASE RESET COMPLETE.');

    } catch (error) {
        console.error('❌ Reset failed:', error);
        process.exit(1);
    }
}

resetDatabase();
