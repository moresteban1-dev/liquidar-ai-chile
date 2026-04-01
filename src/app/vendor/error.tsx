'use client';

/**
 * Vendor Portal Error Boundary
 * Catches errors within the vendor dashboard layout.
 * Provides user-friendly recovery options without exposing stack traces.
 */

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VendorError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'reportError' in window) {
            window.reportError(error);
        }
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
            <div className="max-w-lg w-full p-8 bg-card rounded-2xl shadow-lg border border-destructive/20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                        Error en el Portal
                    </h2>
                </div>

                <p className="text-muted-foreground mb-6">
                    Ocurrió un error inesperado. Puedes intentar de nuevo o volver a tu panel.
                </p>

                {error.digest && (
                    <p className="text-xs text-muted-foreground/60 font-mono mb-4">
                        Ref: {error.digest}
                    </p>
                )}

                <div className="flex gap-3">
                    <Button onClick={() => reset()} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Intentar de nuevo
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/vendor'}
                        className="gap-2"
                    >
                        <Home className="h-4 w-4" />
                        Mi Panel
                    </Button>
                </div>
            </div>
        </div>
    );
}
