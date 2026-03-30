/**
 * Client Quotations API Route - SUPABASE VERSION
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { withAuth } from '@/lib/api/with-auth';

export const GET = withAuth(async (_request, user) => {
    try {
        const supabase = await createApiClient();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { data: quotations, error } = await supabase
            .from('quotations')
            .select(`
                id,
                code,
                public_status,
                status,
                total_client_price,
                created_at,
                brief,
                service:services(name, image_url)
            `)
            .eq('client_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Error fetching client quotations:', error);
            return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
        }

        // Transform to camelCase and handle null/array service
        const transformed = (quotations || []).map((q: Record<string, unknown>) => {
            const svc = q.service as { name: string; image_url: string | null } | Array<{ name: string; image_url: string | null }> | null;
            const serviceData = Array.isArray(svc) ? svc[0] : svc;

            return {
                id: q.id,
                code: q.code,
                publicStatus: q.public_status,
                status: q.status || 'DRAFT',
                totalPrice: q.total_client_price,
                createdAt: q.created_at,
                service: serviceData ? {
                    name: serviceData.name,
                    imageUrl: serviceData.image_url
                } : {
                    name: ((q.brief as string) || '').substring(0, 50) || 'Cotización General',
                    imageUrl: null
                }
            };
        });

        return NextResponse.json(transformed);
    } catch (error) {
        logger.error('Error fetching client quotations:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
});
