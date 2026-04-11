'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCcw, Search, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
     
    const [diagnostic, setDiagnostic] = useState<any>(null);
     
    const [_loading, setLoading] = useState(false);

    useEffect(() => {
        // Log the error for tracking
        logger.error('[AdminError Boundary]', error);

        // Attempt to lookup forensic data if digest exists
        if (error.digest) {
            lookupForensics(error.digest);
        }
    }, [error]);

    const lookupForensics = async (digest: string) => {
        setLoading(true);
        try {
            // Simulated or real forensic lookup
            const res = await fetch(`/api/forensics/lookup?digest=${digest}`);
            if (res.ok) {
                const data = await res.json();
                setDiagnostic(data);
            }
        } catch (e) {
            logger.warn('Failed to fetch diagnostics', { error: (e as Error).message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
            <div className="bg-destructive/10 p-4 rounded-full mb-6">
                <AlertCircle className="h-12 w-12 text-destructive" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Error Crítico en Administración</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
                Ha ocurrido una excepción inesperada durante el renderizado asíncrono.
                El sistema forense ha capturado los detalles técnicos para su análisis.
            </p>

            {diagnostic ? (
                <div className="w-full max-w-2xl text-left mb-8 space-y-4">
                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle className="flex items-center gap-2">
                            Análisis Forense
                            <Badge variant="outline" className="text-[10px] uppercase">
                                {diagnostic.category || 'Desconocido'}
                            </Badge>
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                            <p className="font-semibold mb-1">{diagnostic.hypothesis}</p>
                            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                                {diagnostic.fixes?.map((fix: string, i: number) => (
                                    <li key={i}>{fix}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>

                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-2">
                            <Search className="h-3 w-3" /> Stack Trace Digest
                        </p>
                        <code className="text-xs break-all text-foreground/80">
                            {error.digest}
                        </code>
                    </div>
                </div>
            ) : error.digest && (
                <div className="bg-muted p-3 rounded mb-8">
                    <code className="text-xs text-muted-foreground">Digest: {error.digest}</code>
                </div>
            )}

            <div className="flex gap-4">
                <Button onClick={() => reset()} className="gap-2">
                    <RefreshCcw className="h-4 w-4" /> REINTENTAR CARGA
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    RECARGAR PAGINA
                </Button>
            </div>
        </div>
    );
}
