'use client';

import { useState, useEffect } from 'react';

interface Webhook {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  active: boolean;
  failure_count: number;
  last_triggered: string | null;
  created_at: string;
}

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/webhooks')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setWebhooks(json.data.webhooks ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function testWebhook(id: string) {
    const res = await fetch(`/api/admin/webhooks/${id}/test`, { method: 'POST' });
    const json = await res.json();
    alert(json.success ? `✅ Test delivery: ${json.data.status}` : `❌ Failed: ${json.data?.error}`);
  }

  async function toggleWebhook(id: string, active: boolean) {
    await fetch(`/api/admin/webhooks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    });
    setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, active: !active } : w));
  }

  if (loading) return <div className="panel-loading p-8 text-center text-muted">Cargando webhooks...</div>;

  return (
    <div className="webhook-manager">
      <div className="order-table compact glass rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wider bg-muted/30">URL</th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wider bg-muted/30">Eventos</th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wider bg-muted/30">Estado</th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wider bg-muted/30">Fallos</th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wider bg-muted/30">Último trigger</th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wider bg-muted/30">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.length === 0 ? (
              <tr><td colSpan={6} className="text-center p-8 text-muted">No hay webhooks registrados</td></tr>
            ) : webhooks.map((wh) => (
              <tr key={wh.id} className="border-t border-border/50 hover:bg-accent/10">
                <td className="p-3">
                  <span className="text-xs font-medium block max-w-[200px] truncate" title={wh.url}>
                    {wh.url}
                  </span>
                  {wh.description && <p className="text-[10px] text-muted-foreground">{wh.description}</p>}
                </td>
                <td className="p-3">
                  <div className="webhook-events flex gap-1">
                    {wh.events.slice(0, 2).map((e) => (
                      <span key={e} className="badge badge-neutral text-[9px]">{e}</span>
                    ))}
                    {wh.events.length > 2 && (
                      <span className="text-[9px] text-muted-foreground self-center">+{wh.events.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <span className={`badge text-[10px] ${wh.active ? 'badge-green' : 'badge-red'}`}>
                    {wh.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className={`p-3 text-xs ${wh.failure_count > 10 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                  {wh.failure_count}
                </td>
                <td className="p-3 text-muted-foreground text-[10px] whitespace-nowrap">
                  {wh.last_triggered
                    ? new Date(wh.last_triggered).toLocaleString('es-MX')
                    : 'Nunca'}
                </td>
                <td className="p-3">
                  <div className="action-buttons-inline flex gap-2">
                    <button className="btn btn-xs btn-outline" onClick={() => testWebhook(wh.id)}>
                      🧪 Test
                    </button>
                    <button
                      className={`btn btn-xs ${wh.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                      onClick={() => toggleWebhook(wh.id, wh.active)}
                    >
                      {wh.active ? '⏸ Pausar' : '▶ Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
