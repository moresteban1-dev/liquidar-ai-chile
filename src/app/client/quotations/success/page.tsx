"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const code = searchParams.get("code");

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
            <div className="bg-card p-12 rounded-3xl shadow-xl text-center max-w-lg border border-border">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🎉</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">¡Solicitud Recibida!</h1>
                <p className="text-muted-foreground mb-6">
                    Hemos recibido tu solicitud de cotización correctamente.
                </p>
                {code && (
                    <div className="bg-muted p-4 rounded-xl mb-8">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Código de Seguimiento</p>
                        <p className="text-2xl font-mono font-bold text-blue-600">{code}</p>
                    </div>
                )}
                <Link href="/">
                    <Button fullWidth>Volver al Inicio</Button>
                </Link>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
