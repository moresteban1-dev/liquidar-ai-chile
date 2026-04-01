'use server';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createServiceRoleClientAction } from '@/lib/supabase/api';
import { ActionResponse } from '@/types/actions';

// Helper to determine the correct origin
const getOrigin = () => {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    // Vercel sets this automatically (without protocol)
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3000';
};

import { sendEmail } from '@/lib/email';

export async function resetPasswordAction(email: string): Promise<ActionResponse> {
    try {
        if (!email) {
            return { success: false, error: 'Email requerido' };
        }

        const origin = getOrigin();

        // Critical: Point to callback route to handle PKCE/MagicLink exchange, 
        // then redirect to update-password page.
        const redirectTo = `${origin}/auth/callback?next=/auth/update-password`;

        // Check if we have Resend API Key for custom email sending (Bypasses Supabase Rate Limits)
        const hasResend = !!process.env.RESEND_API_KEY;

        const supabase = await createServiceRoleClientAction();

        if (hasResend) {
            // Smart Provider Detection:
            // Check if user exists and is Social-Only (e.g. Google) to improve UX.
            // 1. Get ID from profiles (public access via service role)
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (profile) {
                // 2. Get User Details
                const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profile.id);

                if (user && !userError) {
                    // 3. Check Identities
                    const identities = user.identities || [];
                    const hasPassword = identities.some(i => i.provider === 'email');
                    const hasGoogle = identities.some(i => i.provider === 'google');

                    // 4. If Google-Only, send "Login Reminder" instead of Reset Link
                    if (hasGoogle && !hasPassword) {
                        console.info('[resetPasswordAction] User is Google-only. Sending login reminder.');
                        await sendEmail({
                            to: email,
                            subject: 'Accede con Google - DropService',
                            html: `
                                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2 style="color: #4F46E5;">Recuperación de Cuenta</h2>
                                    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                                    <p>Notamos que tu cuenta fue creada con <strong>Google</strong>.</p>
                                    <p>No necesitas una contraseña. Simplemente inicia sesión presionando el botón de Google en la página de acceso.</p>
                                    <a href="${origin}/login" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
                                        Ir al Login
                                    </a>
                                </div>
                            `
                        });
                        return { success: true }; // Return success to UI privacy
                    }
                }
            }

            // Strategy A: Admin Generate Link + Custom Email (Bypasses email rate limits)
            const { data, error: linkError } = await supabase.auth.admin.generateLink({
                type: 'recovery',
                email,
                options: { redirectTo }
            });

            if (linkError) {
                logger.error('[resetPasswordAction] Supabase link generation failed', linkError);
                return { success: false, error: linkError.message };
            }
            if (!data.properties?.action_link) {
                return { success: false, error: 'No se pudo generar el enlace de recuperación' };
            }

            // Send email via Resend
            const emailResult = await sendEmail({
                to: email,
                subject: 'Recuperación de Contraseña - DropService',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4F46E5;">Recupera tu contraseña</h2>
                        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón:</p>
                        <a href="${data.properties.action_link}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
                            Restablecer Contraseña
                        </a>
                        <p style="color: #666; font-size: 14px;">Si no solicitaste esto, puedes ignorar este correo.</p>
                    </div>
                `
            });

            if (!emailResult.success) {
                logger.error('[resetPasswordAction] Resend failed:', emailResult.error);
                // Fallback to standard method if Resend fails
                logger.warn('[resetPasswordAction] Resend failed. Falling back to standard Supabase email...');
            } else {
                return { success: true };
            }
        }

        // Strategy B: Standard Supabase Email (Subject to strict rate limits)
        // Used if no Resend key or if Resend failed.
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });

        if (resetError) {
            logger.error('[resetPasswordAction] Standard reset failed', resetError);
            return { success: false, error: resetError.message };
        }

        return { success: true };
    } catch (error) {
        logger.error('[resetPasswordAction] Unexpected Error:', error);
        return {
            success: false,
            error: 'Error inesperado al procesar la solicitud'
        };
    }
}
