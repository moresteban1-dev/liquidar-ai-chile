'use client';

/**
 * Login Page - Standardized Design (Deep Purple/Cosmic)
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { LiquidCard } from '@/components/ui/liquid-card';
import { UserRole, normalizeRole } from '@/core/domain/auth/UserRole';
import { validateRedirectUrl } from '@/lib/security/redirect-validator';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    const errorParam = searchParams.get('error');
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(() => {
        if (errorParam === 'missing_code') return 'Error de autenticación: código faltante';
        if (errorParam === 'auth_failed') return 'Error de autenticación con Google';
        if (errorParam === 'server_error') return 'Error del servidor';
        return '';
    });
    const [loading, setLoading] = useState(false);

    // Client-side auto-redirect if already logged in
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Fetch role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                const role = normalizeRole(profile?.role);
                let target = '/client';
                if (role === UserRole.ADMIN) target = '/admin';
                else if (role === UserRole.VENDOR) target = '/vendor';
                else target = '/client';

                 
                router.push(target as any);
            }
        };
        checkSession();
    }, [supabase, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail || !password) {
            setError('Ingresa email y contraseña');
            setLoading(false);
            return;
        }

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password,
            });

            if (authError) {
                logger.error('Supabase Auth Error:', authError);
                if (authError.message.includes('Invalid login credentials')) {
                    setError('Tu email o contraseña no son correctos.');
                } else if (authError.message.includes('Email not confirmed')) {
                    setError('Por favor confirma tu email antes de ingresar.');
                } else {
                    setError(`Error: ${authError.message}`);
                }
                setLoading(false);
                return;
            }

            if (data.user) {
                // Fetch user profile to get role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                const role = normalizeRole(profile?.role);

                let targetUrl = '/client';
                switch (role) {
                    case UserRole.ADMIN:
                        targetUrl = '/admin';
                        break;
                    case UserRole.VENDOR:
                        targetUrl = '/vendor';
                        break;
                    case UserRole.CLIENT:
                    default:
                        targetUrl = '/client';
                        break;
                }

                // 🛡️ Layer 3: Redirect Sanitization (Anti-Open Redirect)
                const safeTarget = validateRedirectUrl(callbackUrl, targetUrl);
                targetUrl = safeTarget;

                 
                router.push(targetUrl as any);
                router.refresh();
            }
        } catch (err: unknown) {
            logger.error('Login error:', err);
            const msg = err instanceof Error ? err.message : 'Error desconocido';
            setError(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md relative z-10">
            {/* Logo */}
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-3 group">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                        <span className="text-white font-bold text-xl">DS</span>
                    </div>
                    <div className="text-left">
                        <span className="font-bold text-2xl text-white block tracking-tight">DropService</span>
                        <span className="text-xs text-indigo-300 font-medium tracking-wide">Eventos & Equipamiento</span>
                    </div>
                </Link>
            </div>

            {/* Premium Card */}
            <LiquidCard className="p-8 backdrop-blur-xl bg-slate-900/40 border-slate-700/50 shadow-2xl">
                <h1 className="text-2xl font-bold text-white text-center mb-2">
                    Bienvenido de nuevo
                </h1>
                <p className="text-slate-400 text-center mb-6 text-sm">
                    Accede a tu panel de control
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                {/* Google Sign-In */}
                <div className="mb-6">
                    <GoogleAuthButton
                        mode="signin"
                        redirectTo={`/auth/callback?next=${encodeURIComponent(callbackUrl)}`}
                        fullWidth
                    />
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0f172a] px-2 text-slate-500">o correo electrónico</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder:text-slate-600 outline-none"
                            placeholder="nombre@ejemplo.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                Contraseña
                            </label>
                            <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder:text-slate-600 outline-none"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </LiquidCard>

            {/* Footer */}
            <p className="text-center text-slate-500 text-sm mt-6">
                ¿No tienes cuenta?{' '}
                <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    Regístrate aquí
                </Link>
            </p>
        </div>
    );
}

function LoginLoading() {
    return (
        <div className="w-full max-w-md relative z-10">
            <LiquidCard className="p-8 backdrop-blur-xl bg-slate-900/40 border-slate-700/50">
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-400 text-sm">Cargando...</p>
                </div>
            </LiquidCard>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-950 selection:bg-indigo-500/30 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[10%] right-[20%] w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <Suspense fallback={<LoginLoading />}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
