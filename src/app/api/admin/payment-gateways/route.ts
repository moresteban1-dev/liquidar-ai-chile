// ============================================================
// app/api/admin/payment-gateways/route.ts
// ============================================================

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encryptConfig, decryptConfig } from '@/lib/payments/encryption';
import { withAdmin } from '@/lib/api/with-auth';

export const runtime = 'edge';

// GET: Listar todos los gateways (con config completa para admin)
export const GET = withAdmin(async () => {
    const supabase = await createClient();

    const { data: gateways, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;

    // IMPORTANTE: Aquí las configs vienen encriptadas de la BD. 
    // Procedemos a desencriptar para que el Admin UI pueda editar
    const decryptedGateways = (gateways || []).map((gw: any) => {
        try {
            return {
                ...gw,
                config: decryptConfig(gw.config)
            };
        } catch {
            logger.error("Failed to decrypt gateway config:", gw.slug);
            return { ...gw, config: {} };
        }
    });

    return NextResponse.json({ gateways: decryptedGateways });
});

// PUT: Actualizar gateway (activar/desactivar, cambiar config)
export const PUT = withAdmin(async (request) => {
    const supabase = await createClient();

    const body = await request.json();
    const { gateway_id, is_active, config } = body;

    if (!gateway_id) {
        return NextResponse.json(
            { error: 'gateway_id es requerido' },
            { status: 400 }
        );
    }

    // Validar que si se activa, tenga credenciales configuradas
    const { data: existing } = await supabase
        .from('payment_gateways')
        .select('slug, config')
        .eq('id', gateway_id)
        .single();

    if (!existing) {
        return NextResponse.json({ error: 'Gateway no encontrado' }, { status: 404 });
    }

    // 🛡️ PRE-FLIGHT CHECK: Validación estricta de Credenciales
    let configToEvaluate: Record<string, any> = {};

    if (config) {
        configToEvaluate = config as Record<string, any>;
    } else if (existing.config) {
        configToEvaluate = decryptConfig(existing.config as Record<string, unknown>) as Record<string, any>;
    }

    if (is_active === true) {
        const missingKeys: string[] = [];

        switch (existing.slug) {
            case 'webpay':
                if (!configToEvaluate.commerce_code) missingKeys.push('commerce_code');
                if (!configToEvaluate.api_key) missingKeys.push('api_key');
                break;
            case 'flow':
                if (!configToEvaluate.api_key) missingKeys.push('api_key');
                if (!configToEvaluate.secret_key) missingKeys.push('secret_key');
                break;
            case 'khipu':
                if (!configToEvaluate.receiver_id) missingKeys.push('receiver_id');
                if (!configToEvaluate.secret) missingKeys.push('secret');
                break;
            case 'manual_transfer':
                if (!configToEvaluate.instructions) missingKeys.push('instructions');
                break;
        }

        if (missingKeys.length > 0) {
            return NextResponse.json(
                { error: `Faltan credenciales requeridas para activar: ${missingKeys.join(', ')}` },
                { status: 400 }
            );
        }
    }

    // Preparar update
    const updateData: Record<string, unknown> = {};
    if (is_active !== undefined) updateData.is_active = is_active;

    if (config) {
        // Encriptar config antes de guardar
        updateData.config = encryptConfig(config);
    }

    const { data, error } = await supabase
        .from('payment_gateways')
        .update(updateData)
        .eq('id', gateway_id)
        .select()
        .single();

    if (error) throw error;

    return NextResponse.json({
        success: true,
        gateway: data,
        message: is_active !== undefined
            ? `Gateway ${is_active ? 'activado' : 'desactivado'}`
            : 'Configuración actualizada',
    });
});
