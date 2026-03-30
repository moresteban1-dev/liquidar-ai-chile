// ============================================================
// scripts/verify-payments.ts
// ============================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function verifyManualFlow() {
    console.log('🚀 Iniciando Verificación de Flujo Manual...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Faltan variables de entorno (SUPABASE_URL / SERVICE_ROLE_KEY)');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Crear un usuario de prueba (o usar uno existente)
    console.log('👤 Obteniendo usuario de prueba...');
    const { data: users, error: userError } = await supabase.from('users').select('id').limit(1);
    if (userError || !users?.length) {
        console.error('❌ No hay usuarios en la BD para probar.');
        return;
    }
    const userId = users[0].id;
    console.log(`✅ Usuario encontrado: ${userId}`);

    // 2. Crear una orden "pending"
    console.log('📦 Creando orden de prueba...');
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: userId,
            status: 'pending',
            total: 10000,
            payment_status: 'pending' // Asegurar que el enum acepta 'pending'
        })
        .select()
        .single();

    if (orderError) {
        console.error('❌ Error creando orden:', orderError.message);
        return;
    }
    console.log(`✅ Orden creada: ${order.id}`);

    // 3. Simular creación de pago (PaymentService logic)
    // Como no podemos importar PaymentService aquí (es código de servidor Next.js),
    // simularemos la inserción directa DB para verificar triggers/RLS.

    console.log('💳 Creando registro de pago Manual...');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const { data: payment, error: payError } = await supabase
        .from('payments')
        .insert({
            order_id: order.id,
            user_id: userId,
            gateway_slug: 'manual_transfer',
            amount: 10000,
            currency: 'CLP',
            status: 'pending',
            expires_at: expiresAt,
            metadata: {}
        })
        .select()
        .single();

    if (payError) {
        console.error('❌ Error creando pago:', payError.message);
        return;
    }
    console.log(`✅ Pago creado: ${payment.id} (Status: ${payment.status})`);

    // 4. Verificar Log
    const { data: logs } = await supabase
        .from('payment_logs')
        .select('*')
        .eq('payment_id', payment.id);

    console.log(`📋 Logs encontrados: ${logs?.length}`);

    // 5. Simular Subida de Comprobante (Update Status)
    console.log('📤 Simulando subida de comprobante...');
    const { error: updateError } = await supabase
        .from('payments')
        .update({
            status: 'pending_review',
            metadata: { transfer_receipt_url: 'http://mock.url/receipt.jpg' }
        })
        .eq('id', payment.id);

    if (updateError) {
        console.error('❌ Error actualizando pago:', updateError.message);
        return;
    }
    console.log('✅ Estado actualizado a pending_review');

    // 6. Simular Aprobación Admin
    console.log('👮 Simulando aprobación Admin...');
    const { error: approveError } = await supabase
        .from('payments')
        .update({
            status: 'approved', // Mapeado a 'approved' en payments, 'paid' en orders
            paid_at: new Date().toISOString()
        })
        .eq('id', payment.id);

    if (approveError) {
        console.error('❌ Error aprobando pago:', approveError.message);
        return;
    }
    console.log('✅ Pago aprobado');

    // 7. Verificar Actualización de Orden (Debe hacerse manual o via trigger/service)
    // El Service lo hace via `onPaymentApproved`. Aquí validamos si la BD lo permite.
    console.log('📦 Actualizando estado de orden a PAID...');
    const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ payment_status: 'paid', status: 'confirmed' }) // 'confirmed' debe existir en enum
        .eq('id', order.id);

    if (orderUpdateError) {
        console.error('❌ Error actualizando orden:', orderUpdateError.message);
    } else {
        console.log('✅ Orden actualizada correctamente.');
    }

    console.log('🎉 Verificación Completa Exitosamente.');
}

verifyManualFlow().catch(console.error);
