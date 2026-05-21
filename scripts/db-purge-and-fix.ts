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

// Define exactly which real users to KEEP
const REAL_EMAILS = [
    'inversionsanagustin@gmail.com',
    'moresteban2@gmail.com',
    'klexagency@gmail.com',
    'ofcialcrypto@gmail.com'
].map(email => email.toLowerCase());

async function runPurgeAndFix() {
    console.log('🏛️ STARTING DATABASE PURGE AND PROVIDER FIX (ENTERPRISE GRADE)\n');

    try {
        // --- STEP 1: FETCH ALL USERS ---
        console.log('🔍 Paging auth.users to identify accounts to purge...');
        let page = 1;
        let allAuthUsers: any[] = [];
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

        console.log(`🔐 Total users found in auth.users: ${allAuthUsers.length}`);

        const authUsersToKeep = allAuthUsers.filter(u => REAL_EMAILS.includes(u.email?.toLowerCase() || ''));
        const authUsersToPurge = allAuthUsers.filter(u => !REAL_EMAILS.includes(u.email?.toLowerCase() || ''));

        console.log(`   - Real users to keep (${authUsersToKeep.length}):`, authUsersToKeep.map(u => u.email).join(', '));
        console.log(`   - Test users to purge (${authUsersToPurge.length})`);

        const purgeUserIds = authUsersToPurge.map(u => u.id);

        if (purgeUserIds.length === 0) {
            console.log('✅ No users need to be purged.');
        } else {
            // --- STEP 2: CASCADE DELETE TRANSACTIONAL RECORDS IN THE DATABASE ---
            console.log('\n🗑️ Cascading transactional tables for test users...');

            // Table list and the respective column to filter for delete
            // We order them carefully to avoid foreign key violations.
            
            // 1. Order Items
            console.log('   - Cleaning order_items...');
            const { data: ordersToClean } = await supabase
                .from('orders')
                .select('id')
                .or(`client_id.in.(${purgeUserIds.join(',')}),provider_id.in.(${purgeUserIds.join(',')})`);
            
            if (ordersToClean && ordersToClean.length > 0) {
                const orderIds = ordersToClean.map(o => o.id);
                const { count: orderItemsCount, error: err1 } = await supabase
                    .from('order_items')
                    .delete({ count: 'exact' })
                    .in('order_id', orderIds);
                if (err1) console.error('     ⚠️ Error cleaning order_items:', err1.message);
                else console.log(`     ✅ Cleaned ${orderItemsCount} order_items`);
            }

            // 2. Orders
            console.log('   - Cleaning orders...');
            const { count: ordersCount, error: err2 } = await supabase
                .from('orders')
                .delete({ count: 'exact' })
                .or(`client_id.in.(${purgeUserIds.join(',')}),provider_id.in.(${purgeUserIds.join(',')})`);
            if (err2) console.error('     ⚠️ Error cleaning orders:', err2.message);
            else console.log(`     ✅ Cleaned ${ordersCount} orders`);

            // 3. Provider Bids
            console.log('   - Cleaning provider_bids...');
            const { count: bidsCount, error: err3 } = await supabase
                .from('provider_bids')
                .delete({ count: 'exact' })
                .in('provider_id', purgeUserIds);
            if (err3) console.error('     ⚠️ Error cleaning provider_bids:', err3.message);
            else console.log(`     ✅ Cleaned ${bidsCount} provider_bids`);

            // 4. Quotation Items
            console.log('   - Cleaning quotation_items...');
            const { data: quotesToClean } = await supabase
                .from('quotations')
                .select('id')
                .or(`client_id.in.(${purgeUserIds.join(',')}),assigned_provider_id.in.(${purgeUserIds.join(',')})`);
            
            if (quotesToClean && quotesToClean.length > 0) {
                const quoteIds = quotesToClean.map(q => q.id);
                const { count: quoteItemsCount, error: err4 } = await supabase
                    .from('quotation_items')
                    .delete({ count: 'exact' })
                    .in('quotation_id', quoteIds);
                if (err4) console.error('     ⚠️ Error cleaning quotation_items:', err4.message);
                else console.log(`     ✅ Cleaned ${quoteItemsCount} quotation_items`);
            }

            // 5. Quotations
            console.log('   - Cleaning quotations...');
            const { count: quotesCount, error: err5 } = await supabase
                .from('quotations')
                .delete({ count: 'exact' })
                .or(`client_id.in.(${purgeUserIds.join(',')}),assigned_provider_id.in.(${purgeUserIds.join(',')})`);
            if (err5) console.error('     ⚠️ Error cleaning quotations:', err5.message);
            else console.log(`     ✅ Cleaned ${quotesCount} quotations`);

            // 6. Client Feedback
            console.log('   - Cleaning client_feedback...');
            const { count: feedbackCount, error: err6 } = await supabase
                .from('client_feedback')
                .delete({ count: 'exact' })
                .or(`client_id.in.(${purgeUserIds.join(',')}),provider_id.in.(${purgeUserIds.join(',')})`);
            if (err6) console.log('     ℹ️ client_feedback table might not exist or empty:', err6.message);
            else console.log(`     ✅ Cleaned ${feedbackCount} client_feedback`);

            // 7. Client Documents
            console.log('   - Cleaning client_documents...');
            const { count: docsCount, error: err7 } = await supabase
                .from('client_documents')
                .delete({ count: 'exact' })
                .in('client_id', purgeUserIds);
            if (err7) console.log('     ℹ️ client_documents table might not exist or empty:', err7.message);
            else console.log(`     ✅ Cleaned ${docsCount} client_documents`);

            // 8. Client Notifications
            console.log('   - Cleaning client_notifications...');
            const { count: notifsCount, error: err8 } = await supabase
                .from('client_notifications')
                .delete({ count: 'exact' })
                .in('client_id', purgeUserIds);
            if (err8) console.log('     ℹ️ client_notifications table might not exist or empty:', err8.message);
            else console.log(`     ✅ Cleaned ${notifsCount} client_notifications`);

            // 9. Provider Inventory
            console.log('   - Cleaning provider_inventory...');
            const { count: invCount, error: err9 } = await supabase
                .from('provider_inventory')
                .delete({ count: 'exact' })
                .in('provider_id', purgeUserIds);
            if (err9) console.log('     ℹ️ provider_inventory table might not exist or empty:', err9.message);
            else console.log(`     ✅ Cleaned ${invCount} provider_inventory`);

            // 10. Provider Profiles
            console.log('   - Cleaning provider_profiles...');
            const { count: provProfCount, error: err10 } = await supabase
                .from('provider_profiles')
                .delete({ count: 'exact' })
                .in('user_id', purgeUserIds);
            if (err10) console.error('     ⚠️ Error cleaning provider_profiles:', err10.message);
            else console.log(`     ✅ Cleaned ${provProfCount} provider_profiles`);

            // 11. Public Profiles
            console.log('   - Cleaning public.profiles...');
            const { count: profilesCount, error: err11 } = await supabase
                .from('profiles')
                .delete({ count: 'exact' })
                .in('id', purgeUserIds);
            if (err11) console.error('     ⚠️ Error cleaning public.profiles:', err11.message);
            else console.log(`     ✅ Cleaned ${profilesCount} public.profiles`);

            // --- STEP 3: DELETE USERS FROM AUTH.USERS ---
            console.log('\n🔐 Deleting users from auth.users...');
            let deletedAuthCount = 0;
            for (const user of authUsersToPurge) {
                const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
                if (deleteError) {
                    console.error(`   ⚠️ Failed to delete auth user ${user.email} (${user.id}):`, deleteError.message);
                } else {
                    deletedAuthCount++;
                }
            }
            console.log(`   ✅ Successfully deleted ${deletedAuthCount} users from auth.users`);
        }

        // --- STEP 4: FIX `moresteban2@gmail.com` ---
        console.log('\n🛠️ Applying fix for moresteban2@gmail.com...');
        const morestebanId = '9c457d63-7224-4ece-b3af-d1a697087aa0';
        const morestebanEmail = 'moresteban2@gmail.com';

        // Check if moresteban auth user is there
        const morestebanAuth = allAuthUsers.find(u => u.email?.toLowerCase() === morestebanEmail);
        if (!morestebanAuth) {
            console.error(`❌ User ${morestebanEmail} is missing in auth.users. Cannot apply fix.`);
        } else {
            console.log(`   - Found auth user ID: ${morestebanAuth.id}`);

            // A. Upsert public profile
            console.log('   - Upserting profile into public.profiles...');
            const { error: profileUpsertError } = await supabase
                .from('profiles')
                .upsert({
                    id: morestebanId,
                    email: morestebanEmail,
                    name: 'Esteban Proveedor',
                    role: 'PROVEEDOR',
                    phone: '+56900000000',
                    updated_at: new Date().toISOString()
                });

            if (profileUpsertError) {
                throw new Error(`Failed to upsert profile for moresteban2: ${profileUpsertError.message}`);
            }
            console.log('     ✅ Profile upserted successfully.');

            // B. Upsert provider profile
            console.log('   - Upserting provider profile into public.provider_profiles...');
            const { error: provProfileUpsertError } = await supabase
                .from('provider_profiles')
                .upsert({
                    user_id: morestebanId,
                    specialty: 'Equipamiento & Producción General',
                    is_active: true,
                    rating: 5.0,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (provProfileUpsertError) {
                throw new Error(`Failed to upsert provider profile for moresteban2: ${provProfileUpsertError.message}`);
            }
            console.log('     ✅ Provider profile upserted successfully.');

            // C. Sync user role in auth.users app_metadata & user_metadata
            console.log('   - Syncing metadata in auth.users...');
            const { error: authMetaError } = await supabase.auth.admin.updateUserById(morestebanId, {
                app_metadata: { role: 'PROVEEDOR' },
                user_metadata: { role: 'PROVEEDOR' }
            });

            if (authMetaError) {
                console.error('     ⚠️ Warning: Failed to sync auth user metadata:', authMetaError.message);
            } else {
                console.log('     ✅ Auth user metadata synced successfully.');
            }
        }

        console.log('\n🎉 PURGE AND FIX OPERATION COMPLETED SUCCESSFULLY!');

    } catch (error: any) {
        console.error('\n💥 FATAL ERROR during purge and fix:', error.message || error);
    }
}

runPurgeAndFix();
