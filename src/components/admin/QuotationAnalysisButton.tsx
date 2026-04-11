'use client';

import { Button } from '@/components/ui/button';
import { useAction } from '@/hooks/use-action';
import { runBiasAnalysis } from '@/actions/analysis';
import { Loader2, BrainCircuit, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner'; // Assuming Sonner is used, common in modern stacks. Fallback to console if not.

interface QuotationAnalysisButtonProps {
    description: string;
}

export function QuotationAnalysisButton({ description }: QuotationAnalysisButtonProps) {
    const { execute, isPending, data, isSuccess, error } = useAction(runBiasAnalysis, {
        onSuccess: (data) => {
            toast.success(`Análisis completado: Score de Sesgo ${data.overallBiasScore}/100`);
        },
        onError: (err) => {
            toast.error(`Error en análisis: ${err}`);
        }
    });

    const handleAnalyze = () => {
        execute({
            content: description,
            options: { depth: 'standard', language: 'es' }
        });
    };

    if (isSuccess && data) {
        return (
            <div className="p-4 border rounded-lg bg-slate-50 space-y-2">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    <span>Análisis IA Completado</span>
                </div>
                <div className="text-sm text-slate-600">
                    <p><strong>Nivel de Sesgo:</strong> {data.overallBiasScore}/100</p>
                    <p><strong>Resumen:</strong> {data.summary}</p>
                </div>
                {data.biasesDetected.length > 0 && (
                    <div className="mt-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Sesgos Detectados:</p>
                        <ul className="list-disc list-inside text-xs text-red-600 mt-1">
                            { }
                            {data.biasesDetected.map((b: any, i: number) => (
                                <li key={i}>{b.name} ({b.severity})</li>
                            ))}
                        </ul>
                    </div>
                )}
                <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isPending} className="mt-2">
                    Re-analizar
                </Button>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50 space-y-2">
                <div className="flex items-center gap-2 text-red-700 font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Error al analizar</span>
                </div>
                <p className="text-xs text-red-600">{error}</p>
                <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isPending} className="mt-1 bg-white">
                    Intentar de nuevo
                </Button>
            </div>
        );
    }

    return (
        <Button
            onClick={handleAnalyze}
            disabled={isPending || !description}
            variant="secondary"
            className="w-full sm:w-auto gap-2"
        >
            {isPending ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analizando...
                </>
            ) : (
                <>
                    <BrainCircuit className="w-4 h-4" />
                    Analizar Sesgos con IA
                </>
            )}
        </Button>
    );
}
