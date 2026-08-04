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
    // If Cloudflare Turnstile secret key is not configured, bypass CAPTCHA requirement
    if (!process.env.TURNSTILE_SECRET_KEY) return true;
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

        // 🛡️ Layer 6: Supabase Auth Creation (Admin with fallback to standard signUp)
        let userId: string | null = null;
        let authErrorMessage: string | null = null;

        try {
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
                authErrorMessage = authError.message;
                logger.warn('[REGISTER] Admin createUser failed, trying standard signUp:', { message: authError.message });
            } else if (creationData.user) {
                userId = creationData.user.id;
            }
        } catch (adminErr: any) {
            logger.warn('[REGISTER] Admin client error:', { message: adminErr?.message });
        }

        // Fallback: If admin creation failed, try standard signUp via public client
        if (!userId) {
            const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
            const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc0NzQsImV4cCI6MjA4NTYxMzQ3NH0.v9MrG2kIDmQ_Kf3NJ-1l2Em99u2NrsOb8_fBh18eIgA';
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.supabase_SUPABASE_URL || DEFAULT_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.supabase_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

            const { createClient: createPublicClient } = await import('@supabase/supabase-js');
            const publicClient = createPublicClient(supabaseUrl, supabaseKey);

            const { data: signUpData, error: signUpError } = await publicClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        role: role
                    }
                }
            });

            if (signUpError || !signUpData.user) {
                const msg = signUpError?.message || authErrorMessage || 'Error al crear la cuenta en Supabase';
                logger.error('[REGISTER] SignUp failed:', msg);
                return NextResponse.json({ error: msg }, { status: 400 });
            }

            userId = signUpData.user.id;
        }

        // 🛡️ Layer 7: Profile Sync
        try {
            await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: userId,
                    email,
                    name,
                    role
                });
        } catch (err) {
            logger.warn('[REGISTER] Non-blocking profile sync failed', err);
        }

        // Create provider profile if needed
        if (role === UserRole.VENDOR) {
            try {
                await supabaseAdmin.from('provider_profiles').upsert({ user_id: userId });
            } catch (err) {
                logger.warn('[REGISTER] Non-blocking provider profile creation failed', err);
            }
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
