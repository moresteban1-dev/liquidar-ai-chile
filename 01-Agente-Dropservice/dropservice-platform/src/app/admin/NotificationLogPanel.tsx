'use client';

import { useEffect, useState } from 'react';

/**
 * Lazy loaded panel for notification logs.
 * Demonstrates dynamic import for non-critical dashboard elements.
 */

export default function NotificationLogPanel() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // Simulated realtime logs
    const initialLogs = [
      { id: 1, type: 'success', msg: 'Cache invalidada para Orden #12', time: 'hace 2m' },
      { id: 2, type: 'info', msg: 'Nuevo registro de proveedor: Blue Eventos', time: 'hace 5m' },
      { id: 3, type: 'warning', msg: 'Límite de RPS alcanzado en API /orders', time: 'hace 12m' },
    ];
    setLogs(initialLogs);
  }, []);

  return (
    <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-4">Log de Actividad Reciente</h3>
      <div className="space-y-3">
        {logs.map(log => (
          <div key={log.id} className="flex gap-3 items-start p-3 bg-muted/50 rounded-xl text-xs">
            <div className={`h-2 w-2 mt-1 rounded-full shrink-0 ${
              log.type === 'success' ? 'bg-emerald-500' : 
              log.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
            }`} />
            <div className="flex-1">
              <p className="text-foreground font-medium">{log.msg}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{log.time}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 py-2 text-xs font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors">
        Ver Logs Completos
      </button>
    </div>
  );
}
