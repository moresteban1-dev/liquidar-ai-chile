/**
 * Registration API Route - SUPABASE VERSION
 * POST /api/auth/register
 * 
 * Uses Supabase Service Role to create users directly (Admin privilege)
 * Useful for creating seeding users or specific test accounts.
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole } from '@/core/domain/auth/UserRole';

// Access Codes (Keep for testing simplicity)
const ACCESS_CODES = {
    ADMIN: 'admin-test-2026',
    PROVEEDOR: 'provider-test-2026',
};

export const POST = withAuth(async (request) => {
    try {
        const supabaseAdmin = createServiceRoleClient();

        const body = await request.json();
        const { name, email, password, isProvider } = body;

        // Validations
        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
        }

        // Determine Role
        let role: UserRole = UserRole.CLIENT;
        if (isProvider === true || isProvider === 'true') role = UserRole.VENDOR;
        if (body.accessCode && body.accessCode === ACCESS_CODES.ADMIN) role = UserRole.ADMIN;

        // Create Auth User
        const { data: creationData, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                role: role
            }
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!creationData.user) {
            return NextResponse.json({ error: 'No se pudo crear usuario' }, { status: 500 });
        }

        // Create or Update Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert(
                {
                    id: creationData.user.id,
                    email: email,
                    name: name,
                    role: role
                },
                { onConflict: 'id' }
            );

        if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(creationData.user.id);
            return NextResponse.json({ error: `Error creando perfil: ${profileError.message}` }, { status: 500 });
        }

        // If Provider, create provider profile
        if (role === UserRole.VENDOR) {
            const { error: providerError } = await supabaseAdmin
                .from('provider_profiles')
                .upsert(
                    { user_id: creationData.user.id },
                    { onConflict: 'user_id' }
                );

            if (providerError) {
                logger.error('[Register API] Error creating provider profile:', providerError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Usuario creado exitosamente',
            user: {
                id: creationData.user.id,
                email: email,
                role: role
            }
        });

    } catch (error) {
        logger.error('[Register API] Error:', error);
        return NextResponse.json(
            { error: `Error interno` },
            { status: 500 }
        );
    }
});
