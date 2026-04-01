'use client';

import { useAction } from '@/hooks/use-action';
import { runBiasAnalysis } from '@/actions/analysis';
import { AnalysisInput, analysisInputSchema } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { BiasResultsView } from '@/components/features/analysis/bias-results-view';

export function BiasAnalysisForm() {
    const form = useForm<AnalysisInput>({
        resolver: zodResolver(analysisInputSchema) as Resolver<AnalysisInput>,
        defaultValues: {
            title: '',
            content: '',
            type: 'bias',
            options: { depth: 'standard', language: 'es' },
        },
    });

    const analysis = useAction(runBiasAnalysis, {
        onSuccess: () => {
            toast.success('Análisis completado exitosamente');
        },
        onError: (error, code) => {
            if (code === 'AI_RATE_LIMITED') {
                toast.error('Has alcanzado el límite. Espera un momento.');
            } else {
                toast.error(error);
            }
        },
    });

    const onSubmit = form.handleSubmit((data) => {
        analysis.execute(data);
    });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Análisis de Sesgos</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Título del análisis
                            </label>
                            <input
                                {...form.register('title')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Ej: Discurso político 2024"
                                disabled={analysis.isPending}
                            />
                            {form.formState.errors.title && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.title.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Contenido a analizar
                            </label>
                            <Textarea
                                {...form.register('content')}
                                placeholder="Pega aquí el texto que deseas analizar..."
                                rows={8}
                                className="resize-none"
                                disabled={analysis.isPending}
                            />
                            {form.formState.errors.content && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.content.message}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Select
                                value={form.watch('options.depth')}
                                onValueChange={(v) =>
                                    form.setValue('options.depth', v as NonNullable<AnalysisInput['options']>['depth'])
                                }
                                disabled={analysis.isPending}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Profundidad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="quick">Rápido (~5s)</SelectItem>
                                    <SelectItem value="standard">Estándar (~15s)</SelectItem>
                                    <SelectItem value="deep">Profundo (~30s)</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                type="submit"
                                disabled={analysis.isPending}
                                className="min-w-[140px]"
                            >

                                {analysis.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analizando...
                                    </>
                                ) : (
                                    'Analizar'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Error State */}
            {analysis.isError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{analysis.error}</AlertDescription>
                </Alert>
            )}

            {/* Success State */}
            {analysis.isSuccess && analysis.data && (
                <BiasResultsView data={analysis.data} />
            )}
        </div>
    );
}
