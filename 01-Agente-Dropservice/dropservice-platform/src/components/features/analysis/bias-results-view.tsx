'use client';

import { BiasAnalysisOutput } from '@infrastructure/ai/flows/bias-analysis.flow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function BiasResultsView({ data }: { data: BiasAnalysisOutput }) {
    const getScoreColor = (score: number) => {
        if (score < 30) return 'text-green-600';
        if (score < 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical': return <Badge variant="destructive">Crítico</Badge>;
            case 'high': return <Badge variant="destructive" className="bg-orange-500">Alto</Badge>;
            case 'medium': return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Medio</Badge>;
            case 'low': return <Badge variant="secondary">Bajo</Badge>;
            default: return <Badge variant="outline">{severity}</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Overview Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Nivel de Sesgo Detectado</CardTitle>
                        <CardDescription>Puntaje global del contenido (0-100)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 mb-2">
                            <span className={`text-4xl font-bold ${getScoreColor(data.overallBiasScore)}`}>
                                {data.overallBiasScore}
                            </span>
                            <span className="text-slate-400 mb-1">/ 100</span>
                        </div>
                        <Progress value={data.overallBiasScore} className="h-2" />
                        <p className="text-xs text-slate-500 mt-2">
                            {data.overallBiasScore < 30 ? "El contenido es mayormente objetivo." :
                                data.overallBiasScore < 60 ? "Se detectaron sesgos moderados." :
                                    "El contenido presenta sesgos significativos."}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Objetividad</CardTitle>
                        <CardDescription>Índice de neutralidad</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-bold text-blue-600">
                                {data.objectivityScore}
                            </span>
                            <span className="text-slate-400 mb-1">%</span>
                        </div>
                        <Progress value={data.objectivityScore} className="h-2 bg-blue-100" />
                        <p className="text-xs text-slate-500 mt-2">
                            {data.summary}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recommendations */}
            {data.recommendations.length > 0 && (
                <Card className="bg-blue-50/50 border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4" /> Recomendaciones de Mejora
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                            {data.recommendations.map((rec: string, i: number) => (
                                <li key={i}>{rec}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Biases List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    Sesgos Identificados ({data.biasesDetected.length})
                </h3>

                {data.biasesDetected.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed">
                        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-slate-600">No se detectaron sesgos evidentes.</p>
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                        {data.biasesDetected.map((bias: any, i: number) => (
                            <AccordionItem key={i} value={`bias-${i}`}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center justify-between w-full pr-4">
                                        <span className="text-left font-medium">{bias.name}</span>
                                        {getSeverityBadge(bias.severity)}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="text-slate-600 bg-slate-50/50 p-4 rounded-md space-y-3">
                                    <div>
                                        <strong className="text-xs uppercase text-slate-400">Descripción:</strong>
                                        <p className="text-sm">{bias.description}</p>
                                    </div>

                                    {bias.textEvidence && (
                                        <div className="bg-red-50 p-2 rounded border-l-2 border-red-300">
                                            <strong className="text-xs uppercase text-red-400">Evidencia:</strong>
                                            <p className="text-sm italic text-red-700">&quot;{bias.textEvidence}&quot;</p>
                                        </div>
                                    )}

                                    {bias.debiasingSuggestion && (
                                        <div className="bg-green-50 p-2 rounded border-l-2 border-green-300">
                                            <strong className="text-xs uppercase text-green-400">Sugerencia:</strong>
                                            <p className="text-sm text-green-800">{bias.debiasingSuggestion}</p>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </div>
        </div>
    );
}
