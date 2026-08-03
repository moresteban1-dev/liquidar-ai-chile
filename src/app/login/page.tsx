'use client';

/**
 * Login Page — Liquidar.cl B2B Subastas Platform
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { LiquidCard } from '@/components/ui/liquid-card';
import { BrandLogo } from '@/components/shared/BrandLogo';
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

    const ADMIN_EMAILS = ['inversionsanagustin@gmail.com', 'moresteban1@gmail.com', 'admin@liquidar.cl'];

    // Client-side auto-redirect if already logged in
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const userEmail = session.user.email?.toLowerCase();
                const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);

                let role = UserRole.CLIENT;
                if (isAdmin) {
                    role = UserRole.ADMIN;
                } else {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .maybeSingle();
                    role = normalizeRole(profile?.role);
                }

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
            setError('Ingresa tu correo y contraseña para continuar');
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
                    setError('Tu correo o contraseña no coinciden.');
                } else if (authError.message.includes('Email not confirmed')) {
                    setError('Por favor confirma tu correo electrónico antes de ingresar.');
                } else {
                    setError(`Error: ${authError.message}`);
                }
                setLoading(false);
                return;
            }

            if (data.user) {
                const userEmail = data.user.email?.toLowerCase();
                const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);

                let role = UserRole.CLIENT;
                if (isAdmin) {
                    role = UserRole.ADMIN;
                } else {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', data.user.id)
                        .maybeSingle();
                    role = normalizeRole(profile?.role);
                }

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

                const requestedCallback = searchParams.get('callbackUrl');
                if (requestedCallback && requestedCallback !== '/') {
                    targetUrl = validateRedirectUrl(requestedCallback, targetUrl);
                }

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

    const handleDirectAccess = (roleName: string, targetPath: string) => {
        document.cookie = `demo_role=${roleName}; path=/; max-age=86400; SameSite=Lax`;
        router.push(targetPath as any);
        router.refresh();
    };

    return (
        <div className="w-full max-w-md relative z-10">
            {/* Dedicated Header & Brand Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center mb-3">
                    <BrandLogo variant="white" size="xl" />
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-semibold tracking-wider uppercase mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Plataforma Oficial B2B Subastas Chile
                </div>
            </div>

            {/* Premium Glassmorphic Login Card */}
            <LiquidCard className="p-8 backdrop-blur-2xl bg-slate-900/80 border-white/10 shadow-2xl rounded-3xl">
                <h1 className="text-2xl font-bold text-white text-center mb-1">
                    Iniciar Sesión
                </h1>
                <p className="text-slate-400 text-center mb-6 text-xs">
                    Accede a tu cuenta de comprador o vendedor de lotes
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-5 text-xs font-medium animate-in fade-in slide-in-from-top-2">
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
                        <div className="w-full border-t border-slate-700/60" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-semibold tracking-wider">
                        <span className="bg-[#0f172a] px-3 text-slate-400">O con tu correo registrado</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-amber-400" />
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-white placeholder:text-slate-600 outline-none text-sm"
                            placeholder="tu-correo@empresa.cl"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                Contraseña
                            </label>
                            <Link href="/forgot-password" className="text-[11px] text-amber-400 hover:text-amber-300 font-medium transition-colors">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-white placeholder:text-slate-600 outline-none text-sm"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2 text-sm"
                    >
                        {loading ? 'Ingresando...' : 'Ingresar al Portal'}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>

                {/* Direct Access Quick Bar for Testing & Instant Access */}
                <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                    <p className="text-[11px] text-amber-400 font-bold mb-2 uppercase tracking-wider">🚀 Acceso Directo e Inmediato a Dashboards:</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleDirectAccess('admin', '/admin')}
                            className="w-full sm:w-auto px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/50 text-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                        >
                            👑 Dashboard Admin
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDirectAccess('client', '/client')}
                            className="w-full sm:w-auto px-3.5 py-2 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 text-blue-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                        >
                            🛍️ Comprador B2B
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDirectAccess('vendor', '/vendor')}
                            className="w-full sm:w-auto px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                        >
                            🏢 Vendedor
                        </button>
                    </div>
                </div>
            </LiquidCard>

            {/* Footer */}
            <p className="text-center text-slate-400 text-xs mt-6">
                ¿Aún no tienes cuenta en Liquidar.cl?{' '}
                <Link href="/register" className="text-amber-400 hover:text-amber-300 font-bold transition-colors underline">
                    Regístrate aquí
                </Link>
            </p>
        </div>
    );
}

function LoginLoading() {
    return (
        <div className="w-full max-w-md relative z-10">
            <LiquidCard className="p-8 backdrop-blur-xl bg-slate-900/80 border-slate-700/50">
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-400 text-xs">Cargando módulo de acceso...</p>
                </div>
            </LiquidCard>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-background selection:bg-amber-500/30 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Glowing Accent Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[15%] left-[25%] w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[15%] right-[25%] w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <Suspense fallback={<LoginLoading />}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
