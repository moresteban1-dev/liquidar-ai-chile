'use client';

/**
 * Registration Page - Standardized Design (Deep Purple/Cosmic)
 * Migrated from NextAuth to Supabase Auth
 */

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LiquidCard } from '@/components/ui/liquid-card';

function RegisterForm() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        isProvider: false
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.id]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // Call Backend API to handle both User Creation and Profile Creation (Admin Privileges)
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle duplicate email case
                if (data.error?.includes('already registered')) {
                    throw new Error('Este email ya está registrado. Intenta iniciar sesión.');
                }
                throw new Error(data.error || 'Error al registrarse');
            }

            setSuccess('¡Cuenta creada exitosamente! Ingresa con tus credenciales.');

            // Auto-login or redirect
            setTimeout(() => {
                router.push('/login?registered=true');
            }, 2000);

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error al registrarse';
            setError(errorMessage);
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
                    Crear Cuenta
                </h1>
                <p className="text-slate-400 text-center mb-6 text-sm">
                    Únete a nuestra plataforma de servicios
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm animate-in fade-in slide-in-from-top-2">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                            Nombre completo
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder:text-slate-600 outline-none"
                            placeholder="Juan Pérez"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder:text-slate-600 outline-none"
                            placeholder="tu@correo.cl"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder:text-slate-600 outline-none"
                            placeholder="Mínimo 6 caracteres"
                            required
                            minLength={6}
                        />
                    </div>

                    {/* Provider Checkbox */}
                    <div className="pt-2">
                        <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-700/50 rounded-xl hover:bg-slate-800/50 transition-colors bg-slate-900/30">
                            <input
                                id="isProvider"
                                type="checkbox"
                                checked={formData.isProvider}
                                onChange={handleChange}
                                className="w-5 h-5 text-indigo-600 border-slate-600 rounded focus:ring-indigo-500 focus:ring-offset-slate-900 bg-slate-800"
                            />
                            <div>
                                <span className="block text-sm font-medium text-slate-200">
                                    Quiero ofrecer mis servicios
                                </span>
                                <span className="block text-xs text-slate-500">
                                    Regístrate como Proveedor
                                </span>
                            </div>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] mt-4"
                    >
                        {loading ? 'Creando cuenta...' : 'Registrarse'}
                    </button>
                </form>
            </LiquidCard>

            {/* Footer */}
            <p className="text-center text-slate-500 text-sm mt-6">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    Ingresa aquí
                </Link>
            </p>
        </div>
    );
}

function RegisterLoading() {
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

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-slate-950 selection:bg-indigo-500/30 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[10%] right-[20%] w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <Suspense fallback={<RegisterLoading />}>
                <RegisterForm />
            </Suspense>
        </div>
    );
}
