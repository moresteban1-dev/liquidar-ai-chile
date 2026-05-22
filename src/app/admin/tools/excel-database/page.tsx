'use client';

import { useState } from 'react';
import { ArrowLeft, Database, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExcelDropZone, AILoadingState } from '@/components/admin/tools';
import { runExcelDataEnrichmentAction } from '@/app/actions/tools.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Componente para leer Excel (MVP simulado, en prod usaríamos librerías como xlsx o PapaParse)
export default function ExcelDatabasePage() {
  const [file, setFile] = useState<File | null>(null);
  const [industry, setIndustry] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    toast.success(`Archivo ${selectedFile.name} cargado correctamente.`);
  };

  const handleProcess = async () => {
    if (!file || !industry) {
      toast.error('Sube un archivo e indica la industria para continuar.');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // MVP Simulación: Leemos el CSV/Excel como texto plano (en prod, parseo real)
      const text = await file.text();
      const rows = text.split('\n').slice(0, 10).join('\n'); // Tomamos max 10 filas para no exceder tokens

      const response = await runExcelDataEnrichmentAction({
        templateType: 'prospects',
        columns: ['Nombre', 'Empresa', 'Email', 'Teléfono'], // Simulado
        sampleData: rows,
        industry: industry,
        enrichmentGoals: ['Categorizar tamaño', 'Detectar roles', 'Limpiar teléfonos']
      });

      if (response.status === 'success') {
        setResult(response.data);
        toast.success('Datos enriquecidos con éxito');
      } else {
        toast.error(`Error: ${response.error}`);
      }
    } catch (error) {
      toast.error('Error al procesar el archivo.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="max-w-4xl mx-auto py-20">
        <AILoadingState 
          phases={[
            'Leyendo y parseando estructura del archivo...',
            'Identificando entidades y columnas...',
            'Enriqueciendo datos faltantes vía IA...',
            'Limpiando formatos y deduplicando...'
          ]}
          currentPhaseIndex={Math.floor(Date.now() / 1500) % 4}
          title="Importador y Limpiador de Excel"
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/tools">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Importador Inteligente</h1>
          <p className="text-muted-foreground">Sube tus bases de datos para que la IA las limpie, categorice y enriquezca.</p>
        </div>
      </div>

      {!result ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Archivo de Origen</CardTitle>
              <CardDescription>Sube tu CSV o Excel con los leads o datos a procesar.</CardDescription>
            </CardHeader>
            <CardContent>
              <ExcelDropZone 
                onFileSelect={handleFileSelect} 
                accept=".csv,.xlsx" 
                maxSizeMB={5}
              />
            </CardContent>
          </Card>

          <Card className="glass-card flex flex-col">
            <CardHeader>
              <CardTitle>Contexto para la IA</CardTitle>
              <CardDescription>Ayuda a la IA a entender qué está analizando.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label>Industria / Rubro de la BD</Label>
                <Input 
                  placeholder="Ej: Empresas de Logística" 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border mt-auto">
                <h4 className="text-sm font-medium mb-2">Lo que hará la IA:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Detectará columnas automáticamente.</li>
                  <li>Limpiará formatos de email y teléfono.</li>
                  <li>Categorizará cada empresa por tamaño.</li>
                  <li>Aislará registros duplicados o corruptos.</li>
                </ul>
              </div>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
              <Button 
                size="lg" 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleProcess}
                disabled={!file || !industry}
              >
                <Database className="mr-2 h-5 w-5" /> Enriquecer y Limpiar Base
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        /* VISTA DE RESULTADOS */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-green-500/30 bg-green-50/30 dark:bg-green-900/10">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-green-900 dark:text-green-100 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  Archivo procesado con éxito
                </h3>
                <p className="text-green-800 dark:text-green-200 mt-1">
                  Se analizaron {result.length} registros usando Gemini 1.5 Pro.
                </p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-4 w-4" /> Exportar Limpio (CSV)
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Muestra de Datos Enriquecidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="p-3 rounded-tl-lg">Fila Original</th>
                      <th className="p-3">Clasificación IA</th>
                      <th className="p-3">Calidad de Dato</th>
                      <th className="p-3">Duplicado</th>
                      <th className="p-3 rounded-tr-lg">Correcciones Sugeridas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="p-3 font-medium">#{row.originalRowId}</td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span>{row.classification.industry}</span>
                            <span className="text-xs text-muted-foreground">{row.classification.estimatedSize}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            row.dataQuality.status === 'complete' ? 'bg-green-100 text-green-700' : 
                            row.dataQuality.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {row.dataQuality.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          {row.potentialDuplicate ? (
                            <span className="text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Sí</span>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </td>
                        <td className="p-3">
                          <pre className="text-xs bg-muted/50 p-1 rounded max-w-[200px] overflow-hidden text-ellipsis">
                            {JSON.stringify(row.suggestedCorrections)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
