'use client';

import { useEffect } from 'react';
import { RefreshCcw, Home, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

export default function ClientError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Enviar a sistema de observabilidad del lado del cliente si fuera necesario
        logger.error('[ClientError Boundary]', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-8 animate-pulse">
                <RefreshCcw className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            </div>

            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ¡Ups! Algo no salió como esperábamos
            </h1>
            <p className="text-muted-foreground text-lg mb-10">
                Hubo un problema técnico al cargar esta sección. No te preocupes, ya hemos notificado a nuestro equipo técnico para solucionarlo.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button onClick={() => reset()} className="h-12 px-8 text-lg font-medium group">
                    <RefreshCcw className="mr-2 h-5 w-5 group-active:animate-spin" />
                    Intentar de nuevo
                </Button>
                <Button variant="outline" asChild className="h-12 px-8 text-lg font-medium">
                    <Link href="/">
                        <Home className="mr-2 h-5 w-5" /> Ir al Inicio
                    </Link>
                </Button>
            </div>

            <div className="mt-12 pt-8 border-t border-border w-full">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <MessageSquare className="h-4 w-4" />¿Necesitas ayuda inmediata?
                    <Link href="#" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                        Contactar soporte
                    </Link>
                </p>
            </div>
        </div>
    );
}
