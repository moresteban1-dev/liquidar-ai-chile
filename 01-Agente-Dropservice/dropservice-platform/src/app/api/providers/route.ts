/**
 * Providers API Route - SUPABASE VERSION
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole } from '@/core/domain/auth/UserRole';

export const GET = withAuth(async (_request, user) => {
    try {
        const supabase = createServiceRoleClient();

        if (user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { data: providers, error } = await supabase
            .from('profiles')
            .select(`
                id,
                name,
                email,
                provider_profiles(rating, completed_orders)
            `)
            .eq('role', UserRole.VENDOR);

        if (error) {
            logger.error('Error fetching providers:', error);
            return NextResponse.json({ error: 'Error fetching providers' }, { status: 500 });
        }

        // Transform to match expected format
        const transformed = (providers || []).map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            providerProfile: (p as any).provider_profiles?.[0] || null
        }));

        return NextResponse.json(transformed);
    } catch (error) {
        logger.error('Error fetching providers:', error);
        return NextResponse.json({ error: 'Error fetching providers' }, { status: 500 });
    }
});
