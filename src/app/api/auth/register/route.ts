import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';
import { z } from 'zod';
import { rateLimit } from '@/lib/security/rate-limiter';
import { sanitizeInput } from '@/lib/security/sanitize';

// 🛡️ Layer 2: Strict Input Validation (Zod)
const RegisterSchema = z.object({
    name: z.string().min(2).max(100).transform(sanitizeInput),
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(6).max(128),
    isProvider: z.boolean().optional(),
    adminInvitationToken: z.string().optional(), // Replacement for hardcoded code
});

async function verifyCaptcha(token: string | undefined): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') return true;
    if (!token) return false;

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${token}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const outcome = await response.json();
        return outcome.success;
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';

    try {
        // 🛡️ Layer 1: Rate Limiting
        const limitRes = await rateLimit({
            identifier: clientIp,
            action: 'register',
            maxAttempts: 5,
            windowMs: 3600000 // 1 hour
        });
        if (!limitRes.allowed) {
            return NextResponse.json(
                { error: 'Demasiados intentos de registro. Intenta más tarde.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        
        // 🛡️ Layer 3: Captcha Verification
        const isHuman = await verifyCaptcha(body.captchaToken);
        if (!isHuman) {
            return NextResponse.json({ error: 'Fallo de verificación CAPTCHA' }, { status: 403 });
        }

        const validation = RegisterSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Datos de registro inválidos', details: validation.error.format() },
                { status: 400 }
            );
        }

        const { name, email, password, isProvider, adminInvitationToken } = validation.data;

        const supabaseAdmin = createServiceRoleClient();

        // 🛡️ Layer 5: Enumeration Prevention
        // We check if user exists but return a generic success message
        const { data: existingUser } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            // Sanitize email for logging (show only domain)
            const sanitizedEmail = email.includes('@')
                ? `***@${email.split('@')[1]}`
                : '***';
            logger.warn(`[REGISTER] Attempted duplicate registration for: ${sanitizedEmail}`);
            return NextResponse.json({
                success: true,
                message: 'Si el correo no está registrado, recibirás un mensaje de confirmación.',
            });
        }

        // 🛡️ Layer 4: Role Assignment logic
        let role: UserRole = UserRole.CLIENT;
        if (isProvider) role = UserRole.VENDOR;

        // Validate admin invitation token if provided
        if (adminInvitationToken && adminInvitationToken === process.env.ADMIN_INVITATION_SECRET) {
            role = UserRole.ADMIN;
            logger.info('[REGISTER] Admin role assigned via invitation token');
        }

        // 🛡️ Layer 6: Supabase Auth Admin Creation
        const { data: creationData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                role: role
            }
        });

        if (authError) {
            logger.error('[REGISTER] Auth creation failed:', authError);
            return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 });
        }

        // 🛡️ Layer 7: Manual Profile Sync (Redundant to future trigger)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: creationData.user!.id,
                email,
                name,
                role
            });

        if (profileError) {
            logger.error('[REGISTER] Profile sync failed:', profileError);
            // Rollback auth user if profile fails
            await supabaseAdmin.auth.admin.deleteUser(creationData.user!.id);
            return NextResponse.json({ error: 'Error al sincronizar perfil' }, { status: 500 });
        }

        // Create provider profile if needed
        if (role === UserRole.VENDOR) {
            await supabaseAdmin.from('provider_profiles').upsert({ user_id: creationData.user!.id });
        }

        return NextResponse.json({
            success: true,
            message: 'Cuenta creada exitosamente. Ya puedes iniciar sesión.',
        });

    } catch (err) {
        logger.error('[REGISTER] Unexpected error:', err);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
