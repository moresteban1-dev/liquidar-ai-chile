/**
 * Categories Detail API Route - SUPABASE VERSION
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole } from '@/core/domain/auth/UserRole';

// PUT: Update category
export const PUT = withAuth(async (request, user, params) => {
    try {
        const clientResult = await createApiClient();
    if (clientResult.isFailure()) return NextResponse.json({ error: clientResult.getError().message }, { status: 401 });
    const supabase = clientResult.getValue();

        if (user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const id = params?.id;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const body = await request.json();
        const { name, icon, description, imageUrl } = body;

        const updateData: Record<string, unknown> = { name };
        if (icon !== undefined) updateData.icon = icon;
        if (description !== undefined) updateData.description = description;
        if (imageUrl !== undefined) updateData.image_url = imageUrl;

        const { data: category, error } = await supabase
            .from('categories')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('Error updating category:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return NextResponse.json(category);
    } catch (error) {
        logger.error('Error updating category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

// DELETE: Delete category
export const DELETE = withAuth(async (_request, user, params) => {
    try {
        const clientResult = await createApiClient();
    if (clientResult.isFailure()) return NextResponse.json({ error: clientResult.getError().message }, { status: 401 });
    const supabase = clientResult.getValue();

        if (user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const id = params?.id;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        // Check if services exist
        const { count } = await supabase
            .from('services')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', id);

        if ((count || 0) > 0) {
            return NextResponse.json(
                { error: 'Cannot delete category with associated services' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            logger.error('Error deleting category:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error deleting category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});
