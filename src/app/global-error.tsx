'use client';

import { useEffect, useState } from 'react';

/**
 * Global Root Error Boundary — Enhanced with Forensic Diagnostics
 *
 * This is the LAST LINE OF DEFENSE. It wraps the entire <html> element.
 * If this triggers, the root layout itself crashed.
 * 
 * REGLA CRÍTICA: Este archivo NO DEBE importar módulos externos que puedan fallar.
 * Usar solo console.* nativo y fetch del navegador.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [diagnostics, setDiagnostics] = useState<{
        category?: string;
        severity?: string;
        quickFix?: string;
        suggestedFixes?: string[];
    } | null>(null);

    useEffect(() => {
        // Logging directo con console — NUNCA importar módulos externos en global-error
        console.error('[GLOBAL ROOT ERROR]', error.message, error.stack);

        // Report to forensic system for diagnosis
        fetch('/api/forensics/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                digest: error.digest,
                name: error.name,
                message: error.message,
                stack: error.stack,
                url: typeof window !== 'undefined' ? window.location.href : 'unknown',
                timestamp: new Date().toISOString(),
            }),
        })
            .then((res) => res.json())
            .then(setDiagnostics)
            .catch(() => { /* Forensic API may not be available */ });
    }, [error]);

    return (
        <html>
            <body className="min-h-screen bg-gray-950 flex items-center justify-center p-10" style={{ fontFamily: 'system-ui, sans-serif' }}>
                <div className="max-w-xl w-full space-y-6 text-center">
                    <div className="text-6xl">💥</div>
                    <h1 className="text-3xl font-bold text-red-400">Error Catastrófico</h1>
                    <p className="text-gray-400">
                        La aplicación falló a nivel de Root Layout. Este error ha sido registrado automáticamente.
                    </p>

                    {/* Digest */}
                    {error.digest && (
                        <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm inline-block">
                            <span className="text-gray-500">Digest: </span>
                            <span className="text-amber-400">{error.digest}</span>
                        </div>
                    )}

                    {/* Forensic Diagnosis */}
                    {diagnostics?.category && (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left space-y-3">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${diagnostics.severity === 'critical' ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'
                                    }`}>
                                    {diagnostics.severity?.toUpperCase()}
                                </span>
                                <span className="text-gray-400 text-sm font-mono">{diagnostics.category}</span>
                            </div>
                            {diagnostics.quickFix && (
                                <div className="text-green-400 text-sm">
                                    <strong>🔧 Solución rápida:</strong> {diagnostics.quickFix}
                                </div>
                            )}
                            {diagnostics.suggestedFixes && diagnostics.suggestedFixes.length > 1 && (
                                <details className="text-sm">
                                    <summary className="text-gray-400 cursor-pointer">Más soluciones...</summary>
                                    <ul className="mt-2 space-y-1">
                                        {diagnostics.suggestedFixes.slice(1, 4).map((fix, i) => (
                                            <li key={i} className="text-gray-300 flex items-start gap-2">
                                                <span className="text-green-400">→</span>
                                                <span>{fix}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            )}
                        </div>
                    )}

                    {/* Error Details */}
                    <details className="text-left">
                        <summary className="text-gray-500 cursor-pointer text-sm">Detalles técnicos</summary>
                        <div className="mt-2 bg-gray-900 p-4 rounded-lg text-xs font-mono text-gray-400 overflow-auto max-h-60 border border-gray-800">
                            <div><strong className="text-gray-300">Error:</strong> {error.message}</div>
                            <div><strong className="text-gray-300">Digest:</strong> {error.digest ?? 'N/A'}</div>
                            {error.stack && (
                                <pre className="mt-2 whitespace-pre-wrap text-red-400/60">{error.stack}</pre>
                            )}
                        </div>
                    </details>

                    {/* Actions */}
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => reset()}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Reintentar
                        </button>
                        <button
                            onClick={() => (window.location.href = '/')}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Ir al Inicio
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
