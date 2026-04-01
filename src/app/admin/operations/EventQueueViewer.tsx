'use client';

import { useState, useEffect } from 'react';

export default function EventQueueViewer() {
  const [stats, setStats] = useState<{ pending: number; processing: number; completed: number; failed: number; dead: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/events')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStats(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="panel-loading p-8 text-center text-muted">Cargando...</div>;
  if (!stats) return <div className="panel-error p-8 text-center text-destructive">Error al cargar cola de eventos</div>;

  return (
    <div className="event-queue">
      <div className="queue-stats grid grid-cols-3 gap-3 mb-6">
        <QueueStat label="Pending" value={stats.pending} color="#f59e0b" />
        <QueueStat label="Processing" value={stats.processing} color="#3b82f6" />
        <QueueStat label="Completed" value={stats.completed} color="#10b981" />
        <QueueStat label="Failed" value={stats.failed} color="#ef4444" />
        <QueueStat label="Dead" value={stats.dead} color="#6b7280" />
      </div>

      {stats.dead > 0 && (
        <div className="queue-alert mb-4">
          ⚠️ {stats.dead} eventos en Dead Letter Queue. Revisar manualmente.
        </div>
      )}

      <div className="queue-actions mt-4 flex gap-3">
        <button className="btn btn-sm btn-outline flex-1" onClick={() => fetch('/api/cron/process-events').then(() => alert('Eventos procesados'))}>
          ⚡ Procesar ahora
        </button>
        <button className="btn btn-sm btn-outline flex-1" onClick={() => window.open('/api/admin/events', '_blank')}>
          🔍 Ver Detalle
        </button>
      </div>
    </div>
  );
}

function QueueStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="queue-stat">
      <div className="queue-stat-indicator" style={{ backgroundColor: color }} />
      <span className="queue-stat-value">{value}</span>
      <span className="queue-stat-label">{label}</span>
    </div>
  );
}
