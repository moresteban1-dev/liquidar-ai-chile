import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function cleanQuotes() {
    console.log('🚨 Deleting all quotations and related data to reset the flow...');

    try {
        // Find all test quotes or all quotes
        const { data: quotes, error: qError } = await supabase.from('quotations').select('id');
        if (qError) throw qError;

        console.log(`Found ${quotes.length} quotations. Deleting...`);

        // We can just delete from quotations, assuming Cascade. But let's delete explicitly if needed.
        // First, messages
        await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log('Deleted all messages.');

        // Provider bids
        await supabase.from('provider_bids').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log('Deleted all provider bids.');

        // Quotations
        const { error: delError } = await supabase.from('quotations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (delError) {
            console.error('Failed to delete quotations:', delError.message);
        } else {
            console.log('Deleted all quotations.');
        }

        console.log('✅ Quotations reset complete.');
    } catch (error) {
        console.error('❌ Reset failed:', error);
    }
}

cleanQuotes();
