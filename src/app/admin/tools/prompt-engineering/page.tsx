'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, ArrowLeft, CheckCircle2, XCircle, Wand2, Copy } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { AILoadingState, PromptScoreGauge } from '@/components/admin/tools';
import { promptEvaluationInputSchema, type PromptEvaluationFormInput } from '@/lib/validators/tools-validators';
import { runPromptEvaluationAction } from '@/app/actions/tools.actions';

export default function PromptEngineeringPage() {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<PromptEvaluationFormInput>({
    resolver: zodResolver(promptEvaluationInputSchema),
    defaultValues: {
      category: 'marketing'
    }
  });

  const onSubmit = async (data: PromptEvaluationFormInput) => {
    setIsEvaluating(true);
    setResult(null);

    try {
      const response = await runPromptEvaluationAction(data);
      if (response.status === 'success') {
        setResult(response.data);
        toast.success('Evaluación completada');
      } else {
        toast.error(`Error: ${response.error}`);
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Prompt copiado al portapapeles');
  };

  if (isEvaluating) {
    return (
      <div className="max-w-4xl mx-auto py-20">
        <AILoadingState 
          phases={[
            'Analizando sintaxis y claridad del prompt...',
            'Evaluando contexto y especificidad...',
            'Detectando riesgos de alucinación...',
            'Generando versiones mejoradas...'
          ]}
          currentPhaseIndex={Math.floor(Date.now() / 1500) % 4}
          title="Meta-Evaluando tu Prompt"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/tools">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Evaluador de Prompts</h1>
          <p className="text-muted-foreground">Mejora la calidad de tus prompts para obtener mejores resultados de la IA.</p>
        </div>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Tu Prompt Actual</CardTitle>
                <CardDescription>Pega el prompt que estás intentando usar y no te da buenos resultados.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  className="min-h-[250px] text-base p-4"
                  placeholder="Escribe un post de blog sobre marketing digital..."
                  {...register('originalPrompt')}
                />
                {errors.originalPrompt && <span className="text-xs text-red-500 mt-2 block">{errors.originalPrompt.message}</span>}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Contexto</CardTitle>
                <CardDescription>Parámetros para la evaluación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select onValueChange={(v) => setValue('category', v as any)} defaultValue="marketing">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing y Copys</SelectItem>
                      <SelectItem value="sales">Ventas y Emails</SelectItem>
                      <SelectItem value="operations">Operaciones y Procesos</SelectItem>
                      <SelectItem value="research">Investigación y Análisis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Contexto de tu Negocio</Label>
                  <Textarea 
                    placeholder="Somos una agencia B2B que vende software..."
                    {...register('businessContext')}
                  />
                  {errors.businessContext && <span className="text-xs text-red-500">{errors.businessContext.message}</span>}
                </div>
                
                <div className="space-y-2">
                  <Label>Output Deseado (Opcional)</Label>
                  <Input placeholder="Ej: Un JSON estructurado" {...register('desiredOutput')} />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/20">
              <Wand2 className="mr-2 h-5 w-5" /> Optimizar Prompt
            </Button>
          </div>
        </form>
      ) : (
        /* VISTA DE RESULTADOS */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Columna Izquierda: Score y Checklist */}
            <div className="space-y-6">
              <Card className="glass-card flex flex-col items-center justify-center p-8 text-center">
                <PromptScoreGauge score={result.qualityScore} size="lg" />
                <p className="mt-4 text-sm text-muted-foreground">{result.executiveSummary}</p>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base">Checklist de Calidad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.qualityChecklist.map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {item.passed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                      )}
                      <div>
                        <span className={item.passed ? "text-foreground" : "text-red-600 dark:text-red-400 font-medium"}>
                          {item.criterion}
                        </span>
                        {!item.passed && item.recommendation && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.recommendation}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Columna Derecha: Prompts Generados */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-cyan-500/30 bg-cyan-50/30 dark:bg-cyan-900/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-cyan-700 dark:text-cyan-400">Prompt Nivel Experto</CardTitle>
                    <CardDescription>Versión recomendada lista para usar</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.expertPrompt)}>
                    <Copy className="h-4 w-4 mr-2" /> Copiar
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 rounded-lg bg-background text-foreground text-sm whitespace-pre-wrap font-mono border border-border/50">
                    {result.expertPrompt}
                  </pre>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Riesgos Detectados</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    {result.misinterpretationRisks.map((risk: string, i: number) => (
                      <li key={i}>{risk}</li>
                    ))}
                    {result.unconsideredVariables.map((v: string, i: number) => (
                      <li key={`v-${i}`}><strong>Variable omitida:</strong> {v}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setResult(null)}>Evaluar otro prompt</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
