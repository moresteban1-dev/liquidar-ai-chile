'use client';

import { useState, useEffect } from 'react';

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRatePercent: number;
  evictions: number;
  invalidations: number;
  memoryEstimateMB: number;
}

export default function CacheMonitor() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = () => {
      fetch('/api/admin/cache')
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setStats(json.data.stats);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="panel-loading text-center p-8 text-muted">Cargando...</div>;
  if (!stats) return <div className="panel-error text-center p-8 text-destructive">Error al cargar cache stats</div>;

  return (
    <div className="cache-monitor">
      <div className="cache-stats-grid mb-6">
        <div className="cache-stat">
          <span className="cache-stat-value">{stats.size.toLocaleString()}</span>
          <span className="cache-stat-label">Entradas</span>
        </div>
        <div className="cache-stat">
          <span className={`cache-stat-value ${stats.hitRatePercent > 70 ? 'text-green-500' : 'text-yellow-500'}`}>
            {stats.hitRatePercent}%
          </span>
          <span className="cache-stat-label">Hit Rate</span>
        </div>
        <div className="cache-stat">
          <span className="cache-stat-value">{stats.memoryEstimateMB}MB</span>
          <span className="cache-stat-label">Memoria</span>
        </div>
        <div className="cache-stat">
          <span className="cache-stat-value">{stats.evictions.toLocaleString()}</span>
          <span className="cache-stat-label">Evictions</span>
        </div>
      </div>

      <div className="cache-ratio-bar">
        <div className="ratio-fill ratio-hits" style={{ width: `${stats.hitRatePercent}%` }} title={`Hits: ${stats.hits}`} />
        <div className="ratio-fill ratio-misses" style={{ width: `${100 - stats.hitRatePercent}%` }} title={`Misses: ${stats.misses}`} />
      </div>
      <div className="ratio-labels flex justify-between px-1">
        <span className="text-green-500 text-[10px] font-bold">Hits: {stats.hits.toLocaleString()}</span>
        <span className="text-destructive text-[10px] font-bold">Misses: {stats.misses.toLocaleString()}</span>
      </div>

      <div className="cache-actions mt-6 flex gap-3">
        <button className="btn btn-sm btn-outline flex-1" onClick={() => fetch('/api/admin/cache/warm', { method: 'POST' }).then(() => alert('Cache warmed'))}>
          🔥 Warm Cache
        </button>
        <button className="btn btn-sm btn-outline-danger flex-1" onClick={() => { if (confirm('¿Limpiar cache?')) fetch('/api/admin/cache', { method: 'DELETE' }).then(() => window.location.reload()); }}>
          🗑️ Clear All
        </button>
      </div>
    </div>
  );
}
