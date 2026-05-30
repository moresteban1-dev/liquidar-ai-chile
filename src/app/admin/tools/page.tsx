import { Metadata } from 'next';
import { Search, Bot, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { ToolCard, ToolRunHistoryTable } from '@/components/admin/tools';

export const metadata: Metadata = {
  title: 'Herramientas Inteligentes | Dropservice',
  description: 'Centro de herramientas impulsadas por IA para análisis y optimización',
};

// Simulamos datos recientes para el MVP
const mockRecentRuns = [
  {
    id: 'run-1',
    userId: 'user-1',
    toolType: 'competitive-analysis' as const,
    status: 'completed' as const,
    provider: 'gemini' as const,
    input: {},
    output: {},
    tokensUsed: 12500,
    costEstimate: 0.05,
    durationMs: 8400,
    errorMessage: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() as any,
    completedAt: new Date().toISOString() as any
  },
  {
    id: 'run-2',
    userId: 'user-1',
    toolType: 'prompt-engineering' as const,
    status: 'completed' as const,
    provider: 'gemini' as const,
    input: {},
    output: {},
    tokensUsed: 3200,
    costEstimate: 0.01,
    durationMs: 2100,
    errorMessage: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() as any,
    completedAt: new Date().toISOString() as any
  }
];

export default async function AdminToolsPage() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Herramientas IA</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Optimiza tus operaciones, analiza el mercado y genera contenido con nuestros agentes especializados.
          </p>
        </div>
      </div>

      {/* Grid de Herramientas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ToolCard
          title="Análisis Competitivo"
          description="Extrae patrones, debilidades y oportunidades de reseñas de la competencia."
          icon="search"
          href="/admin/tools/competitive-analysis"
          badge="IA Avanzada"
          gradientFrom="#6366f1" // indigo-500
          gradientTo="#8b5cf6" // violet-500
          statsLabel="Análisis realizados"
          statsValue="12"
          delay={0.1}
        />
        
        <ToolCard
          title="Evaluador de Prompts"
          description="Mejora tus prompts con scoring, checklist de calidad y reformulación."
          icon="bot"
          href="/admin/tools/prompt-engineering"
          gradientFrom="#3b82f6" // blue-500
          gradientTo="#06b6d4" // cyan-500
          statsLabel="Prompts optimizados"
          statsValue="45"
          delay={0.2}
        />
        
        <ToolCard
          title="Arquitecto SEO"
          description="Genera contenido estructurado optimizado para la primera página de Google."
          icon="external-link"
          href="/admin/tools/seo-architect"
          badge="Popular"
          gradientFrom="#10b981" // green-500
          gradientTo="#059669" // green-600
          statsLabel="Artículos generados"
          statsValue="8"
          delay={0.3}
        />
        
        <ToolCard
          title="Importador Excel"
          description="Enriquece, limpia y clasifica datos de prospectos masivamente."
          icon="file-spreadsheet"
          href="/admin/tools/excel-database"
          gradientFrom="#f59e0b" // amber-500
          gradientTo="#ea580c" // orange-600
          statsLabel="Filas procesadas"
          statsValue="1.2k"
          delay={0.4}
        />
      </div>

      {/* Historial Reciente */}
      <div className="mt-12 space-y-4">
        <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
          Actividad Reciente
          <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Últimos 30 días
          </span>
        </h2>
        
        <ToolRunHistoryTable runs={mockRecentRuns} />
      </div>
    </div>
  );
}
