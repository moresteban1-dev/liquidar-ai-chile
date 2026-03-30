/**
 * Platform Config API Route - SUPABASE VERSION
 * GET - Get platform configuration (aggregates KV rows into object)
 * PATCH - Update configuration (updates KV rows)
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole } from '@/core/domain/auth/UserRole';

// Default config structure
const DEFAULT_CONFIG = {
    companyName: 'Agencia Digital',
    companyRut: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    defaultMarkup: 50,
    ivaRate: 19,
    currency: 'CLP',
    transferEnabled: true,
    webpayEnabled: false,
    bankName: '',
    bankAccountType: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
    bankAccountRut: ''
};

/**
 * GET /api/config
 */
export const GET = withAuth(async (_request, user) => {
    try {
        const supabase = await createApiClient();

        if (user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'No autorizado / Solo administradores' }, { status: 403 });
        }

        // Fetch all config keys
        const { data: rows, error } = await supabase
            .from('platform_config')
            .select('key, value');

        if (error) {
            logger.error('Error fetching config:', error);
            // Return default if error or empty
            return NextResponse.json(DEFAULT_CONFIG);
        }

        // Convert KV rows to Object
        const config: Record<string, any> = { ...DEFAULT_CONFIG };
        rows?.forEach(row => {
            // Auto-convert numbers/booleans
            if (row.value === 'true') config[row.key] = true;
            else if (row.value === 'false') config[row.key] = false;
            else if (!isNaN(Number(row.value)) && row.value.trim() !== '') config[row.key] = Number(row.value);
            else config[row.key] = row.value;
        });

        const mappedConfig = {
            companyName: config.company_name || DEFAULT_CONFIG.companyName,
            companyRut: config.company_rut || '',
            companyAddress: config.company_address || '',
            companyPhone: config.company_phone || '',
            companyEmail: config.company_email || '',

            defaultMarkup: config.default_markup ?? DEFAULT_CONFIG.defaultMarkup,
            ivaRate: config.iva_rate ?? DEFAULT_CONFIG.ivaRate,
            currency: 'CLP',

            webpayEnabled: config.webpay_enabled ?? false,
            transferEnabled: config.transfer_enabled ?? true,

            bankName: config.bank_name || '',
            bankAccountType: config.bank_account_type || '',
            bankAccountNumber: config.bank_account_number || '',
            bankAccountHolder: config.bank_account_holder || '',
            bankAccountRut: config.bank_account_rut || ''
        };

        return NextResponse.json(mappedConfig);
    } catch (error) {
        logger.error('Error fetching config:', error);
        return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
    }
});

/**
 * PATCH /api/config
 */
export const PATCH = withAuth(async (request, user) => {
    try {
        const supabase = await createApiClient();

        if (user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await request.json();

        // Validate
        if (body.defaultMarkup !== undefined && (body.defaultMarkup < 0 || body.defaultMarkup > 500)) {
            return NextResponse.json({ error: 'Markup inválido' }, { status: 400 });
        }
        if (body.ivaRate !== undefined && (body.ivaRate < 0 || body.ivaRate > 100)) {
            return NextResponse.json({ error: 'IVA inválido' }, { status: 400 });
        }

        // Map camelCase to snake_case keys
        const updates: Record<string, string> = {};
        if (body.companyName !== undefined) updates['company_name'] = body.companyName;
        if (body.companyRut !== undefined) updates['company_rut'] = body.companyRut;
        if (body.companyAddress !== undefined) updates['company_address'] = body.companyAddress;
        if (body.companyPhone !== undefined) updates['company_phone'] = body.companyPhone;
        if (body.companyEmail !== undefined) updates['company_email'] = body.companyEmail;

        if (body.defaultMarkup !== undefined) updates['default_markup'] = String(body.defaultMarkup);
        if (body.ivaRate !== undefined) updates['iva_rate'] = String(body.ivaRate);

        if (body.transferEnabled !== undefined) updates['transfer_enabled'] = String(body.transferEnabled);
        if (body.bankName !== undefined) updates['bank_name'] = body.bankName;
        if (body.bankAccountNumber !== undefined) updates['bank_account_number'] = body.bankAccountNumber;
        if (body.bankAccountType !== undefined) updates['bank_account_type'] = body.bankAccountType;
        if (body.bankAccountHolder !== undefined) updates['bank_account_holder'] = body.bankAccountHolder;
        if (body.bankAccountRut !== undefined) updates['bank_account_rut'] = body.bankAccountRut;

        // Execute updates individually
        for (const [key, value] of Object.entries(updates)) {
            await supabase
                .from('platform_config')
                .upsert({ key, value }, { onConflict: 'key' });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error updating config:', error);
        return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
    }
});
