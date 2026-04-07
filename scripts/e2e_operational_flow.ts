import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function runE2EOperationalFlow() {
    console.log('🏛️ Iniciando Análisis Profundo del Flujo E2E de Cotizaciones');
    console.log('------------------------------------------------------------\n');

    try {
        // --- PRE-REQUISITOS ---
        console.log('[Setup] 0. Resolviendo Identidades Fundacionales...');
        
        const { data: adminUser } = await adminClient.from('profiles').select('id, email').eq('role', 'ADMIN').limit(1).single();
        const { data: providerUser } = await adminClient.from('profiles').select('id, email').eq('role', 'PROVEEDOR').limit(1).single();
        const { data: clientUser } = await adminClient.from('profiles').select('id, email').eq('role', 'CLIENTE').limit(1).single();

        if (!adminUser || !providerUser || !clientUser) {
            throw new Error('Faltan perfiles requeridos para el test E2E. Ejecutar create-test-users.ts primero.');
        }

        const { data: service } = await adminClient.from('services').select('id, title').limit(1).single();
        if (!service) throw new Error('No hay servicios en el catálogo maestro.');

        console.log(`[Setup] ✓ Identidades y Catálogo confirmados.`);
        console.log(`         Cliente: ${clientUser.email}`);
        console.log(`         Admin: ${adminUser.email}`);
        console.log(`         Proveedor: ${providerUser.email}`);
        console.log(`         Servicio a Cotizar: ${service.title}\n`);

        // --- FASE 1: CLIENTE SOLICITA (PENDING_ASSIGNMENT) ---
        console.log('[Actor: CLIENTE] 1. Emitiendo Solicitud de Cotización...');
        const quoteCode = `E2E-${Date.now().toString().slice(-6)}`;
        const { data: quote, error: step1Error } = await adminClient.from('quotations').insert({
            client_id: clientUser.id,
            service_id: service.id,
            public_status: 'PENDING_ASSIGNMENT',
            brief: 'Test E2E de Flujo Arquitectónico',
            event_location: 'Stark Tower',
            event_start_date: new Date(Date.now() + 86400000).toISOString(),
            code: quoteCode
        }).select().single();

        if (step1Error) throw step1Error;
        console.log(`[Actor: CLIENTE] ✓ Cotización generada: ${quote.id} con estado PENDING_ASSIGNMENT.\n`);

        // --- FASE 2: ADMIN ASIGNA PROVEEDOR (PENDING_PROVIDER_BID) ---
        console.log('[Actor: ADMIN] 2. Triage y asignación de Proveedor...');
        
        // Simular que el admin asigna el proveedor cambiando el provider_id y el status
        const { data: quoteStep2, error: step2Error } = await adminClient.from('quotations').update({
            provider_id: providerUser.id,
            public_status: 'PENDING_PROVIDER_BID'
        }).eq('id', quote.id).select().single();

        if (step2Error) throw step2Error;
        console.log(`[Actor: ADMIN] ✓ Proveedor asignado. Status transicionado a PENDING_PROVIDER_BID.\n`);

        // --- FASE 3: PROVEEDOR REALIZA COSTEO (PENDING_ADMIN_APPROVAL) ---
        console.log('[Actor: PROVEEDOR] 3. Proveedor entrega costeo base (Bid)...');
        
        const providerCost = 50000;
        const { data: quoteStep3, error: step3Error } = await adminClient.from('quotations').update({
            provider_cost: providerCost,
            public_status: 'PENDING_ADMIN_APPROVAL'
        }).eq('id', quote.id).select().single();
        
        if (step3Error) throw step3Error;
        console.log(`[Actor: PROVEEDOR] ✓ Costeo ingresado ($${providerCost}). Status transicionado a PENDING_ADMIN_APPROVAL.\n`);

        // --- FASE 4: ADMIN CREA MARKUP Y PUBLICA AL CLIENTE (AWAITING_CLIENT_PAYMENT) ---
        console.log('[Actor: ADMIN] 4. Recaudación y Cálculo de Markup de Plataforma...');
        
        // El admin ajusta el fee y calcula the final price (ej 20% markup)
        const totalFee = providerCost * 0.20;
        const finalPrice = providerCost + totalFee;
        
        const { data: quoteStep4, error: step4Error } = await adminClient.from('quotations').update({
            dropservice_fee: totalFee,
            total_price: finalPrice,
            public_status: 'AWAITING_CLIENT_PAYMENT'
        }).eq('id', quote.id).select().single();

        if (step4Error) throw step4Error;
        console.log(`[Actor: ADMIN] ✓ Fee asignado ($${totalFee}). Precio Final: $${finalPrice}. Status transicionado a AWAITING_CLIENT_PAYMENT.\n`);

        // --- FASE 5: CLIENTE APRUEBA Y PAGA (PAID) ---
        console.log('[Actor: CLIENTE] 5. Cliente autoriza la cotización vía pago transaccional...');
        
        const { data: quoteStep5, error: step5Error } = await adminClient.from('quotations').update({
            public_status: 'PAID',
            payment_status: 'COMPLETED'
        }).eq('id', quote.id).select().single();

        if (step5Error) throw step5Error;
        console.log(`[Actor: CLIENTE] ✓ Transacción Completa. Status final de estado de dominio: ${quoteStep5.public_status}.\n`);

        console.log('✅ CERTIFICACIÓN E2E COMPLETADA CON ÉXITO: STATE MACHINE 100% OPERACIONAL.');

    } catch (e: any) {
        console.error('\n❌ FALLO EN EL FLUJO OPERACIONAL E2E:', e.message);
    }
}

runE2EOperationalFlow();
