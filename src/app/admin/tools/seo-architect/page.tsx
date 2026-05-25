'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, ArrowLeft, PenTool, LayoutTemplate, Link as LinkIcon, Download, Bot } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

import { AILoadingState, SEOPreview, KeywordBadge } from '@/components/admin/tools';
import { seoContentInputSchema, type SEOContentFormInput } from '@/lib/validators/tools-validators';
import { runSEOArchitectAction } from '@/app/actions/tools.actions';

export default function SEOArchitectPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SEOContentFormInput>({
    resolver: zodResolver(seoContentInputSchema),
    defaultValues: {
      contentType: 'article',
      searchIntent: 'informational',
      country: 'Chile'
    }
  });

  const onSubmit = async (data: SEOContentFormInput) => {
    setIsGenerating(true);
    setResult(null);

    try {
      const response = await runSEOArchitectAction(data);
      if (response.status === 'success') {
        setResult(response.data);
        toast.success('Contenido generado exitosamente');
      } else {
        toast.error(`Error: ${response.error}`);
      }
    } catch (error) {
      toast.error('Error al generar el contenido SEO.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="max-w-4xl mx-auto py-20">
        <AILoadingState 
          phases={[
            'Analizando intención de búsqueda y SERPs...',
            'Estructurando jerarquía de headings (H1-H3)...',
            'Optimizando densidad de keywords y semántica LSI...',
            'Generando contenido Markdown y Schema JSON-LD...'
          ]}
          currentPhaseIndex={Math.floor(Date.now() / 2000) % 4}
          title="Arquitecto SEO Trabajando"
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Arquitecto SEO</h1>
          <p className="text-muted-foreground">Genera contenido altamente optimizado para dominar la primera página de Google.</p>
        </div>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Configuración Principal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Contenido</Label>
                    <Select onValueChange={(v) => setValue('contentType', v as any)} defaultValue="article">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">Artículo de Blog</SelectItem>
                        <SelectItem value="service-description">Página de Servicio</SelectItem>
                        <SelectItem value="category-page">Categoría E-commerce</SelectItem>
                        <SelectItem value="landing-page">Landing Page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Intención de Búsqueda</Label>
                    <Select onValueChange={(v) => setValue('searchIntent', v as any)} defaultValue="informational">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="informational">Informativa (Cómo, Qué es)</SelectItem>
                        <SelectItem value="transactional">Transaccional (Comprar, Contratar)</SelectItem>
                        <SelectItem value="commercial-investigation">Investigación Comercial (Mejor X, X vs Y)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tema o Keyword Principal</Label>
                  <Input placeholder="Ej: Servicios de limpieza industrial" {...register('topic')} />
                  {errors.topic && <span className="text-xs text-red-500">{errors.topic.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Industria / Nicho</Label>
                    <Input placeholder="Ej: Facility Services" {...register('industry')} />
                    {errors.industry && <span className="text-xs text-red-500">{errors.industry.message}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label>País Objetivo</Label>
                    <Input placeholder="Ej: Chile" {...register('country')} />
                    {errors.country && <span className="text-xs text-red-500">{errors.country.message}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Datos Adicionales (Opcional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ciudad (SEO Local)</Label>
                  <Input placeholder="Ej: Santiago" {...register('city')} />
                </div>
                
                <div className="space-y-2">
                  <Label>Contenido Existente (Para optimizar/reescribir)</Label>
                  <Textarea 
                    placeholder="Pega aquí el borrador o contenido actual de tu página..." 
                    className="h-32"
                    {...register('existingContent')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="lg" className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20">
              <PenTool className="mr-2 h-5 w-5" /> Generar Contenido SEO
            </Button>
          </div>
        </form>
      ) : (
        /* VISTA DE RESULTADOS */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Top Section: Preview & Score */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SEOPreview 
                title={result.seoTitle} 
                url={result.slug} 
                description={result.metaDescription} 
                keywords={result.primaryKeywords}
              />
            </div>
            <Card className="glass-card flex flex-col justify-center items-center p-6 text-center">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Score SEO</div>
              <div className="text-5xl font-black text-green-500">{result.contentScore}</div>
              <div className="text-sm text-muted-foreground mt-2">{result.wordCount} palabras generadas</div>
            </Card>
          </div>

          {/* Keywords Row */}
          <Card className="glass-card">
            <CardContent className="p-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium mr-2">Keywords Mapeadas:</span>
              {result.primaryKeywords?.map((kw: string, i: number) => (
                <KeywordBadge key={`p-${i}`} keyword={kw} type="primary" />
              ))}
              {result.secondaryKeywords?.map((kw: string, i: number) => (
                <KeywordBadge key={`s-${i}`} keyword={kw} type="secondary" />
              ))}
            </CardContent>
          </Card>

          {/* Main Content Area */}
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="content"><LayoutTemplate className="w-4 h-4 mr-2"/> Contenido</TabsTrigger>
              <TabsTrigger value="structure"><LinkIcon className="w-4 h-4 mr-2"/> Interlinking</TabsTrigger>
              <TabsTrigger value="schema"><Bot className="w-4 h-4 mr-2"/> Schema JSON</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="mt-4">
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Contenido Markdown Generado</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(result.generatedContent);
                    toast.success('Contenido copiado al portapapeles');
                  }}>
                    <Download className="w-4 h-4 mr-2" /> Copiar MD
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] w-full rounded-md border p-4 bg-muted/30">
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {result.generatedContent}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="structure" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Estrategia de Interlinking</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.interlinkingStrategy?.map((link: any, i: number) => (
                      <div key={i} className="border-l-2 border-indigo-500 pl-4 py-1">
                        <p className="font-medium text-sm">Anchor: <span className="text-indigo-600">"{link.anchorText}"</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Relevancia: {link.relevance} | URL sugerida: {link.suggestedUrl}</p>
                        <p className="text-xs italic mt-1">{link.reason}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="schema" className="mt-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Schema Markup (JSON-LD)</CardTitle>
                  <CardDescription>Pega esto en el &lt;head&gt; de tu página para fragmentos enriquecidos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 rounded-lg bg-slate-950 text-green-400 text-sm overflow-x-auto">
                    {JSON.stringify(result.schemaMarkup, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-start gap-4 pt-4">
            <Button variant="outline" onClick={() => setResult(null)}>Generar Nuevo Contenido</Button>
          </div>
        </div>
      )}
    </div>
  );
}
