'use client';

/**
 * Unauthorized Page
 */

import Link from 'next/link';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Acceso Denegado
                </h1>
                <p className="text-slate-600 mb-6 max-w-md">
                    No tienes permisos para acceder a esta página.
                    Por favor, contacta al administrador si crees que es un error.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link
                        href="/"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Volver al Inicio
                    </Link>
                    <Link
                        href="/login"
                        className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium transition-colors"
                    >
                        Iniciar Sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
