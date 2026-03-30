/**
 * Client Items API — Read-only
 * GET: Returns the reformulated quotation lines visible to the client.
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole } from '@/core/domain/auth/UserRole';

export const GET = withAuth(async (_request, user, params) => {
    try {
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const quotationId = params?.id;
        if (!quotationId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        
        const supabase = createServiceRoleClient();

        // Verify the quotation exists and user has access
        const { data: quotation, error: qErr } = await supabase
            .from('quotations')
            .select('id, client_id, status')
            .eq('id', quotationId)
            .single();

        if (qErr || !quotation) {
            return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
        }

        // Client can only see their own items; Admin sees all
        if (user.role === UserRole.CLIENT && quotation.client_id !== user.id) {
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
        }

        const { data, error } = await supabase
            .from('quotation_client_items')
            .select('id, description, quantity, unit_price_net, total_price_net, sort_order')
            .eq('quotation_id', quotationId)
            .order('sort_order', { ascending: true });

        if (error) {
            logger.error('Error fetching client items:', error);
            return NextResponse.json({ error: 'Error cargando ítems' }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        logger.error('Error in client-items route:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
});
