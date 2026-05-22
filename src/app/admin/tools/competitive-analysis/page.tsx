'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AILoadingState, InsightCard } from '@/components/admin/tools';
import { competitiveAnalysisInputSchema, type CompetitiveAnalysisFormInput } from '@/lib/validators/tools-validators';
import { runCompetitiveAnalysisAction } from '@/app/actions/tools.actions';

const SCOPES = [
  { id: 'reviews', label: 'Reseñas de Clientes' },
  { id: 'social', label: 'Redes Sociales' },
  { id: 'website', label: 'Página Web' },
  { id: 'pricing', label: 'Estrategia de Precios' },
  { id: 'messaging', label: 'Mensajes y Posicionamiento' },
  { id: 'value-proposition', label: 'Propuesta de Valor' }
];

export default function CompetitiveAnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null); // Usamos any para el MVP, en prod usaríamos el schema output

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CompetitiveAnalysisFormInput>({
    resolver: zodResolver(competitiveAnalysisInputSchema),
    defaultValues: {
      analysisScope: ['reviews', 'messaging'],
      competitors: [{ name: '', website: '', reviews: '' }]
    }
  });

  const competitors = watch('competitors');
  const selectedScopes = watch('analysisScope') || [];

  const addCompetitor = () => {
    if (competitors.length >= 5) {
      toast.error('Máximo 5 competidores permitidos.');
      return;
    }
    setValue('competitors', [...competitors, { name: '', website: '', reviews: '' }]);
  };

  const removeCompetitor = (index: number) => {
    if (competitors.length <= 1) return;
    const newCompetitors = [...competitors];
    newCompetitors.splice(index, 1);
    setValue('competitors', newCompetitors);
  };

  const handleScopeToggle = (scopeId: string) => {
    const newScopes = selectedScopes.includes(scopeId as any)
      ? selectedScopes.filter(id => id !== scopeId)
      : [...selectedScopes, scopeId];
    setValue('analysisScope', newScopes as any);
  };

  const onSubmit = async (data: CompetitiveAnalysisFormInput) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await runCompetitiveAnalysisAction(data);
      
      if (response.status === 'success') {
        setResult(response.data);
        toast.success('Análisis completado con éxito');
      } else {
        toast.error(`Error: ${response.error}`);
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado al analizar.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="max-w-4xl mx-auto py-20">
        <AILoadingState 
          phases={[
            'Estructurando datos de competidores...',
            'Extrayendo patrones semánticos de reseñas...',
            'Identificando brechas de mercado...',
            'Sintetizando insights accionables...'
          ]}
          currentPhaseIndex={Math.floor(Date.now() / 2000) % 4} // Simula cambio de fase
          title="Ejecutando Análisis Competitivo Profundo"
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Análisis Competitivo</h1>
          <p className="text-muted-foreground">Extrae patrones y oportunidades de la competencia usando IA.</p>
        </div>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Contexto de tu Negocio</CardTitle>
              <CardDescription>Para que la IA entienda contra quién compites.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nombre del Negocio</Label>
                <Input id="businessName" placeholder="Ej: DropService Plataforma" {...register('businessName')} />
                {errors.businessName && <span className="text-xs text-red-500">{errors.businessName.message}</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industria / Rubro</Label>
                <Input id="industry" placeholder="Ej: SaaS B2B" {...register('industry')} />
                {errors.industry && <span className="text-xs text-red-500">{errors.industry.message}</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación (o "Digital")</Label>
                <Input id="location" placeholder="Ej: Global, LATAM, o Ciudad" {...register('location')} />
                {errors.location && <span className="text-xs text-red-500">{errors.location.message}</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetMarket">Público Objetivo (Opcional)</Label>
                <Input id="targetMarket" placeholder="Ej: Agencias de marketing pequeñas" {...register('targetMarket')} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Competidores</CardTitle>
                <CardDescription>Agrega los datos de tus competidores para analizar.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCompetitor}>
                <Plus className="h-4 w-4 mr-2" /> Agregar Competidor
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {competitors.map((comp, index) => (
                <div key={index} className="p-4 rounded-lg border border-border bg-muted/20 relative">
                  {competitors.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-muted-foreground hover:text-red-500"
                      onClick={() => removeCompetitor(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-muted-foreground">Competidor {index + 1}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input placeholder="Ej: CompetitorX" {...register(`competitors.${index}.name`)} />
                      {errors.competitors?.[index]?.name && <span className="text-xs text-red-500">{errors.competitors[index]?.name?.message}</span>}
                    </div>
                    <div className="space-y-2">
                      <Label>Página Web</Label>
                      <Input placeholder="https://..." {...register(`competitors.${index}.website`)} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Reseñas y Quejas (Copia y pega aquí)</Label>
                    <Textarea 
                      placeholder="Copia aquí las reseñas de Google, Trustpilot, comentarios de redes, etc. Mientras más datos crudos, mejores insights." 
                      className="min-h-[100px]"
                      {...register(`competitors.${index}.reviews`)} 
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Alcance del Análisis</CardTitle>
              <CardDescription>¿En qué áreas quieres que la IA se enfoque?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {SCOPES.map(scope => (
                  <div key={scope.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`scope-${scope.id}`} 
                      checked={selectedScopes.includes(scope.id as any)}
                      onCheckedChange={() => handleScopeToggle(scope.id)}
                    />
                    <Label htmlFor={`scope-${scope.id}`} className="font-normal cursor-pointer">
                      {scope.label}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.analysisScope && <span className="text-xs text-red-500 mt-2 block">{errors.analysisScope.message}</span>}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
              <Search className="mr-2 h-5 w-5" /> Generar Análisis Estratégico
            </Button>
          </div>
        </form>
      ) : (
        /* VISTA DE RESULTADOS */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-2">Resumen Ejecutivo</h3>
              <p className="text-indigo-800 dark:text-indigo-200 leading-relaxed">
                {result.executiveSummary}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent">
              <TabsTrigger value="insights" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none">Insights Accionables</TabsTrigger>
              <TabsTrigger value="gaps" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none">Brechas de Mercado</TabsTrigger>
              <TabsTrigger value="patterns" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none">Patrones y Quejas</TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none">Ideas de Contenido</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="insights" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.actionableInsights?.map((insight: any, i: number) => (
                    <InsightCard 
                      key={i}
                      insight={insight.insight}
                      category={insight.category}
                      priority={insight.priority}
                      action={insight.suggestedAction}
                      effort={insight.effort}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="gaps" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {result.marketGaps?.map((gap: any, i: number) => (
                    <Card key={i} className="border-l-4 border-l-purple-500">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{gap.gap}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{gap.opportunity}</p>
                        <div className="flex gap-4">
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-muted">Impacto: {gap.potentialImpact}</span>
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-muted">Dificultad: {gap.difficulty}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Otras tabs omitidas por brevedad en este boilerplate */}
            </div>
          </Tabs>

          <div className="flex gap-4 pt-6">
            <Button variant="outline" onClick={() => setResult(null)}>Hacer otro análisis</Button>
            <Button className="ml-auto">Exportar a PDF</Button>
          </div>
        </div>
      )}
    </div>
  );
}
