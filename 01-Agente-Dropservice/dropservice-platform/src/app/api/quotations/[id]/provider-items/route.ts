/**
 * Provider Items API — Read-only
 * GET: Returns the provider quotation items for a given quotation.
 * Used by admin review panel to load the provider's breakdown.
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

        // Only admins and the assigned provider can view provider items
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.VENDOR) {
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
        }

        const quotationId = params?.id;
        if (!quotationId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const supabase = createServiceRoleClient();

        const { data, error } = await supabase
            .from('quotation_provider_items')
            .select('id, category, concept, quantity, unit_price_net, total_price_net, sort_order')
            .eq('quotation_id', quotationId)
            .order('sort_order', { ascending: true });

        if (error) {
            logger.error('Error fetching provider items:', error);
            return NextResponse.json({ error: 'Error cargando ítems' }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        logger.error('Error in provider-items route:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
});
