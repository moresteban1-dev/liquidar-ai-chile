'use client';

/**
 * Forgot Password Page - Standardized Design
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { resetPasswordAction } from '@/actions/auth';
import { LiquidCard } from '@/components/ui/liquid-card';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    // const supabase = createClient(); // Removed client-side auth for reset
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [retryAfter, setRetryAfter] = useState<number | null>(null);

    // Countdown effect
    useEffect(() => {
        if (!retryAfter) return;

        const interval = setInterval(() => {
            setRetryAfter((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [retryAfter]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) {
            setError('Ingresa tu correo electrónico');
            setLoading(false);
            return;
        }

        try {
            // Use Server Action to bypass client-side IP rate limits
            const result = await resetPasswordAction(trimmedEmail);

            if (!result.success) {
                throw new Error(result.error);
            }

            setSuccess(true);
        } catch (err: unknown) {
            logger.error('Reset password error:', err);
            let msg = err instanceof Error ? err.message : 'Error desconocido';

            if (msg.includes('rate limit') || msg.includes('Too many requests')) {
                setRetryAfter(125);
                msg = 'Has solicitado demasiados intentos. Espera que termine el contador.';
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 selection:bg-indigo-500/30 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[10%] right-[20%] w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                            <span className="text-white font-bold text-xl">DS</span>
                        </div>
                    </Link>
                </div>

                <LiquidCard className="p-8 backdrop-blur-xl bg-slate-900/40 border-slate-700/50 shadow-2xl">
                    <div className="mb-6">
                        <Link href="/login" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Login
                        </Link>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Recuperar Contraseña
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Ingresa tu email y te enviaremos un enlace de recuperación.
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
                            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">¡Correo Enviado!</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Revisa tu bandeja de entrada (y spam) para restablecer tu contraseña.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors"
                            >
                                Volver al Inicio de Sesión
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                                    Correo electrónico
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder:text-slate-600 outline-none"
                                        placeholder="nombre@ejemplo.com"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || retryAfter !== null}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? 'Enviando...' : retryAfter ? `Reintentar en ${retryAfter}s` : 'Enviar Enlace'}
                            </button>
                        </form>
                    )}
                </LiquidCard>
            </div>
        </div>
    );
}
