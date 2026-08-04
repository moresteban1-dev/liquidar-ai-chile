'use client';

/**
 * Quotation Success Page - Public
 * Shows success message after quotation submission
 * Forces Google registration to access the dashboard
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { CheckCircle, ArrowRight, Shield, Clock, Mail } from 'lucide-react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const pendingAuth = searchParams.get('pendingAuth') === 'true';
    const [email, setEmail] = useState('');

    useEffect(() => {
        // Get pending quotation email from localStorage
        const pending = localStorage.getItem('pendingQuotation');
        if (pending) {
            try {
                const data = JSON.parse(pending);
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setEmail(data.email || '');
            } catch (error) {
                logger.error('Failed to parse pending quotation from localStorage:', error);
            }
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Success Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                        ¡Solicitud Recibida!
                    </h1>

                    <p className="text-slate-600 mb-4">
                        Tu cotización ha sido registrada exitosamente con el código:
                    </p>

                    {/* Quote Code */}
                    <div className="bg-slate-100 rounded-xl px-6 py-4 mb-6">
                        <p className="font-mono text-2xl md:text-3xl font-bold text-blue-600">
                            {code || 'QT-XXXXXX'}
                        </p>
                    </div>

                    {/* Timeline */}
                    <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
                        <div className="flex items-center gap-3 mb-3">
                            <Clock className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-slate-900">¿Qué sigue?</span>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">1</span>
                                Recibirás un email de confirmación
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">2</span>
                                Nuestros proveedores preparan tu cotización
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">3</span>
                                Te contactaremos en menos de 24 hrs
                            </li>
                        </ul>
                    </div>

                    {/* Google Registration Section */}
                    {pendingAuth && (
                        <div className="border-t border-slate-200 pt-6 mt-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                                    <Shield className="h-5 w-5" />
                                    Crea tu cuenta para seguir tu cotización
                                </div>
                                <p className="text-sm text-amber-700">
                                    Regístrate con Google para acceder a tu panel, ver el estado de tus cotizaciones y gestionar tus pedidos.
                                </p>
                            </div>

                            <GoogleAuthButton
                                mode="signup"
                                redirectTo={`/auth/callback?quote=${code}`}
                                fullWidth
                            />

                            {email && (
                                <p className="text-xs text-slate-500 mt-3 flex items-center justify-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    Usa el email: <strong>{email}</strong>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Alternative Actions */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <Link
                            href="/"
                            className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                        >
                            Volver al Inicio <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 mt-6">
                    ¿Tienes preguntas? Escríbenos a{' '}
                    <a href="mailto:contacto@liquidar.cl" className="text-blue-600 underline">
                        contacto@liquidar.cl
                    </a>
                </p>
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                <div className="animate-pulse space-y-4">
                    <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto" />
                    <div className="h-6 bg-slate-200 rounded w-48 mx-auto" />
                    <div className="h-4 bg-slate-200 rounded w-64 mx-auto" />
                </div>
            </div>
        </div>
    );
}

export default function QuotationSuccessPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <SuccessContent />
        </Suspense>
    );
}
