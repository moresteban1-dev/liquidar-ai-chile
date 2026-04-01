'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        // Aquí es donde en el futuro inyectaremos Sentry
        logger.error('🚨 [Global Error Boundary] Caught exception:', error);
    }, [error]);

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50/50 p-6 text-center">
            <div className="max-w-md w-full p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col items-center gap-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                    <AlertCircle className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Anomalía Detectada
                    </h2>
                    <p className="text-gray-500">
                        Nuestros sistemas experimentaron una demora de conexión o se interrumpió la carga de datos.
                    </p>
                </div>

                <div className="w-full pt-4">
                    <Button
                        onClick={() => reset()}
                        className="w-full gap-2"
                        size="lg"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Forzar Reintento
                    </Button>
                </div>

                {/* Renderizado exclusivo para desarrolladores */}
                {process.env.NODE_ENV !== 'production' && (
                    <div className="w-full mt-4 p-4 bg-gray-900 rounded-lg text-left overflow-x-auto text-xs text-red-400 font-mono">
                        {error.message || "Fallo silencioso no identificado"}
                    </div>
                )}
            </div>
        </div>
    );
}
