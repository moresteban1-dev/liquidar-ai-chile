'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalLink, Search, Clock, FileSpreadsheet, Bot } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ToolRun, ToolRunStatus, ToolType } from '@/core/domain/tools/tool-execution.types';

interface ToolRunHistoryTableProps {
  runs: ToolRun[];
  onViewResult?: (runId: string) => void;
}

const TOOL_CONFIG: Record<ToolType, { icon: React.ReactNode, label: string }> = {
  'competitive-analysis': { icon: <Search className="h-4 w-4" />, label: 'Análisis Competitivo' },
  'prompt-engineering': { icon: <Bot className="h-4 w-4" />, label: 'Evaluador de Prompts' },
  'seo-architect': { icon: <ExternalLink className="h-4 w-4" />, label: 'Arquitecto SEO' },
  'database-creator': { icon: <FileSpreadsheet className="h-4 w-4" />, label: 'Importador Excel' }
};

const STATUS_CONFIG: Record<ToolRunStatus, { color: string, label: string }> = {
  pending: { color: 'bg-slate-100 text-slate-700', label: 'Pendiente' },
  processing: { color: 'bg-blue-100 text-blue-700 animate-pulse', label: 'Procesando' },
  completed: { color: 'bg-green-100 text-green-700', label: 'Completado' },
  failed: { color: 'bg-red-100 text-red-700', label: 'Fallido' },
  cancelled: { color: 'bg-slate-100 text-slate-500', label: 'Cancelado' }
};

export function ToolRunHistoryTable({ runs, onViewResult }: ToolRunHistoryTableProps) {
  if (!runs || runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl bg-muted/20">
        <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground">No hay historial</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Aún no has ejecutado ninguna herramienta. Tus análisis recientes aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Herramienta</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Duración</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => {
            const tool = TOOL_CONFIG[run.toolType];
            const status = STATUS_CONFIG[run.status];
            
            return (
              <TableRow key={run.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      {tool.icon}
                    </div>
                    <span className="font-medium">{tool.label}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={status.color}>
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                    {run.provider}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground" title={run.createdAt.toLocaleString()}>
                    {formatDistanceToNow(run.createdAt, { addSuffix: true, locale: es })}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onViewResult?.(run.id)}
                    disabled={run.status !== 'completed'}
                  >
                    Ver Resultado
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
