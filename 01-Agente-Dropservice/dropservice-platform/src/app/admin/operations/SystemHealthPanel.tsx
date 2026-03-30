'use client';

import { useSystemHealth } from './hooks/useSystemHealth';

/**
 * Componentes Atómicos para Reducir Carga de Renderizado
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  status: 'ok' | 'warn';
}

const MetricCard = ({ title, value, subtitle, status }: MetricCardProps) => (
  <div className={`metric-card p-4 rounded-lg border bg-card text-card-foreground shadow-sm metric-${status} ${status === 'warn' ? 'border-amber-500/50 bg-amber-500/5' : 'border-border'}`}>
    <p className="metric-title text-xs font-medium text-muted-foreground uppercase mb-1">{title}</p>
    <p className={`metric-value text-2xl font-bold ${status === 'warn' ? 'text-amber-600' : 'text-foreground'}`}>{value}</p>
    <p className="metric-subtitle text-[10px] text-muted-foreground mt-1">{subtitle}</p>
  </div>
);

const ComponentStatusItem = ({ name, status, latencyMs, details }: any) => (
  <div className={`health-component p-3 rounded border mb-2 bg-background/50 border-border/40 health-${status}`}>
    <div className="component-header flex items-center gap-2">
      <span className="component-icon text-sm">{status === 'healthy' ? '✅' : status === 'degraded' ? '⚠️' : '❌'}</span>
      <span className="component-name text-sm font-semibold">{name}</span>
      {latencyMs > 0 && <span className="component-latency ml-auto text-[10px] font-mono text-muted-foreground">{latencyMs}ms</span>}
    </div>
    {details && (
      <div className="component-details mt-2 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-border/20 pt-2">
        {Object.entries(details).map(([key, val]) => (
          <div key={key} className="detail-item flex justify-between">
            <span className="detail-key text-[10px] text-muted-foreground">{key}:</span>
            <span className="detail-value text-[10px] font-mono whitespace-nowrap overflow-hidden text-ellipsis ml-2 text-foreground">
              {typeof val === 'object' ? String((val as any).value ?? JSON.stringify(val)) : String(val)}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default function SystemHealthPanel() {
  const { data, loading, autoRefresh, setAutoRefresh, refresh } = useSystemHealth();

  if (loading) return <div className="panel-loading text-center p-12 text-muted animate-pulse">Iniciando diagnóstico de salud...</div>;
  if (!data) return <div className="panel-error text-center p-12 text-destructive border border-destructive/20 rounded-lg bg-destructive/5">Error crítico: No se pudo obtener la telemetría del sistema</div>;

  const statusColor = data.status === 'healthy' ? 'bg-emerald-500' : data.status === 'degraded' ? 'bg-amber-500' : 'bg-destructive';

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleClearCache = async () => {
    if (!confirm('¿Confirma la purga total del cache? Esta acción es irreversible.')) return;
    try {
      await fetch('/api/admin/cache', { method: 'DELETE' });
      refresh();
    } catch (e) {
      console.error('Cache purge failed:', e);
    }
  };

  return (
    <div className="health-panel space-y-6">
      {/* Header Estilo Dashboard */}
      <div className="health-header flex items-center justify-between p-4 rounded-xl border bg-card/40 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className={`health-status-indicator h-3 w-3 rounded-full animate-pulse ${statusColor}`} />
          <div>
            <h2 className="text-sm font-bold tracking-tight">{data.status.toUpperCase()}</h2>
            <p className="text-[10px] text-muted-foreground">Telemetría v{data.version} — Uptime: {formatUptime(data.uptime)}</p>
          </div>
        </div>
        <div className="health-meta flex items-center gap-6">
          <label className="auto-refresh-toggle flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="w-3 h-3 rounded border-primary bg-background focus:ring-0 cursor-pointer"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span className="text-[10px] font-medium group-hover:text-primary transition-colors">Refresco Auto (15s)</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Component Status Column */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Subsistemas Críticos</h3>
          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {data.components.map((comp) => (
              <ComponentStatusItem key={comp.name} {...comp} />
            ))}
          </div>
        </div>

        {/* Metrics Column */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Métricas de Rendimiento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="Memoria Heap"
              value={`${data.metrics.memory.heapUsedMB}MB`}
              subtitle={`${data.metrics.memory.heapUsagePercent.toFixed(0)}% de ${data.metrics.memory.heapTotalMB}MB`}
              status={data.metrics.memory.heapUsagePercent > 85 ? 'warn' : 'ok'}
            />
            <MetricCard
              title="Cache Efficiency"
              value={`${data.metrics.cache.hitRate}%`}
              subtitle={`${data.metrics.cache.size} entradas (${data.metrics.cache.memoryMB}MB)`}
              status={data.metrics.cache.hitRate < 60 ? 'warn' : 'ok'}
            />
            <MetricCard
              title="Latencia de DB"
              value={`${data.metrics.database.latencyMs}ms`}
              subtitle={`Ratio de acierto: ${data.metrics.database.cacheHitRatio}%`}
              status={data.metrics.database.latencyMs > 200 ? 'warn' : 'ok'}
            />
            <MetricCard
              title="Éxito Notificaciones"
              value={`${data.metrics.notifications.successRate}%`}
              subtitle={`${data.metrics.notifications.sent24h} enviadas / ${data.metrics.notifications.failed24h} fallidas`}
              status={data.metrics.notifications.successRate < 95 ? 'warn' : 'ok'}
            />
          </div>

          <div className="health-actions flex flex-wrap gap-3 pt-4 border-t border-border/40">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-accent transition-all active:scale-95" onClick={refresh}>
              🔄 Refrescar Telemetría
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-accent transition-all active:scale-95" onClick={() => window.open('/api/admin/cache', '_blank')}>
              📊 Ver JSON Crudo
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-destructive/40 text-destructive text-xs font-medium hover:bg-destructive/10 transition-all active:scale-95" onClick={handleClearCache}>
              🗑️ Purgar Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
