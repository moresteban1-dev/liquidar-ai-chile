import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { SupabaseOrderRepository } from '../src/infrastructure/repositories/SupabaseOrderRepository';
import { SupabaseQuotationRepository } from '../src/infrastructure/repositories/SupabaseQuotationRepository';
import { ApproveQuotationUseCase } from '../src/core/use-cases/quotations/ApproveQuotation';
import { createQuotationId } from '../src/core/types/branded';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFlow() {
    console.log('🚀 Setting up a fresh quote to test ApproveQuotationUseCase...');
    try {
        // 1. Setup minimal quote
        const { data: clientAuth } = await supabase.auth.admin.createUser({ 
            email: `testclient${Date.now()}@test.com`, password: 'password123', email_confirm: true 
        });
        const clientId = clientAuth.user?.id;
        if (clientId) {
            await supabase.from('profiles').upsert({ id: clientId, email: clientAuth.user.email, role: 'CLIENTE', name: 'Test Client' });
        }

        const { data: quote, error: quoteError } = await supabase.from('quotations').insert({
            client_id: clientId,
            code: `TEST-PAY-${Date.now()}`,
            brief: 'Test payment flow',
            public_status: 'COTIZADA',
            status: 'AWAITING_CLIENT_PAYMENT',
            price_total: 150000 
        }).select().single();

        if (quoteError) throw quoteError;
        console.log(`✅ Quote Created: ${quote.id}`);

        // 2. Execute Use Case
        const quotationRepo = new SupabaseQuotationRepository();
        const orderRepo = new SupabaseOrderRepository();
        const useCase = new ApproveQuotationUseCase(quotationRepo, orderRepo);

        console.log('🔄 Executing ApproveQuotationUseCase...');
        const result = await useCase.execute(createQuotationId(quote.id));

        if (result.success) {
            console.log(`✅ Use Case Success. Returned Order ID: ${result.data}`);
            
            // Verify order in DB
            const { data: order } = await supabase.from('orders').select('*').eq('id', result.data).single();
            if (order) {
                console.log(`✅ Order verified in database! Code: ${order.code}, Status: ${order.status}`);
            } else {
                console.error(`❌ Order not found in database for ID: ${result.data}`);
            }
        } else {
            console.error(`❌ Use Case Failed:`, result.error);
        }

    } catch (e) {
        console.error('❌ Test failed with exception:', e);
    }
}

testFlow();
