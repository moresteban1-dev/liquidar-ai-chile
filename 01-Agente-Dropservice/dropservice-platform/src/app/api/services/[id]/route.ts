/**
 * Services Detail API Route - SUPABASE VERSION
 * PUT /api/services/[id] - Update service
 * DELETE /api/services/[id] - Delete service
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole } from '@/core/domain/auth/UserRole';

// GET: Get single service
export const GET = withAuth(async (_request, _user, params) => {
    try {
        const id = params?.id;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const supabase = await createApiClient();

        const { data: service, error } = await supabase
            .from('services')
            .select(`
                *,
                category:categories(id, name, slug)
            `)
            .eq('id', id)
            .single();

        if (error) {
            logger.error('Error fetching service:', error);
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        return NextResponse.json(service);
    } catch (error) {
        logger.error('Error fetching service:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

// PUT: Update service
export const PUT = withAuth(async (request, user, params) => {
    try {
        const id = params?.id;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const supabase = await createApiClient();

        if (user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, categoryId, priceFrom, imageUrl, isActive } = body;

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (categoryId !== undefined) updateData.category_id = categoryId;
        if (priceFrom !== undefined) updateData.price_from = priceFrom;
        if (imageUrl !== undefined) updateData.image_url = imageUrl;
        if (isActive !== undefined) updateData.is_active = isActive;

        const { data: service, error } = await supabase
            .from('services')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                category:categories(id, name, slug)
            `)
            .single();

        if (error) {
            logger.error('Error updating service:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return NextResponse.json(service);
    } catch (error) {
        logger.error('Error updating service:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

// DELETE: Delete service
export const DELETE = withAuth(async (_request, user, params) => {
    try {
        const id = params?.id;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const supabase = await createApiClient();

        if (user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if service has quotations
        const { count } = await supabase
            .from('quotations')
            .select('*', { count: 'exact', head: true })
            .eq('service_id', id);

        if ((count || 0) > 0) {
            return NextResponse.json(
                { error: 'No se puede eliminar un servicio con cotizaciones asociadas' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) {
            logger.error('Error deleting service:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error deleting service:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});
