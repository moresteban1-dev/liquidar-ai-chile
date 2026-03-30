'use client';

import { useNotificationLogs, NotifEntry } from './hooks/useNotificationLogs';

interface NotificationTableRowProps {
  entry: NotifEntry;
}

const NotificationTableRow = ({ entry }: NotificationTableRowProps) => {
  return (
    <tr key={entry.id} className="border-t border-border/50 hover:bg-accent/10">
      <td className="p-3 text-muted text-xs whitespace-nowrap">
        {new Date(entry.created_at).toLocaleString('es-MX')}
      </td>
      <td className="p-3"><span className="badge badge-neutral text-[10px]">{entry.event_type}</span></td>
      <td className="p-3 text-xs">{entry.channel === 'email' ? '📧' : '🔗'} {entry.channel}</td>
      <td className="p-3 text-muted text-xs truncate max-w-[150px]">{entry.recipient_email ?? '—'}</td>
      <td className="p-3">
        <span className={`badge text-[10px] ${entry.status === 'sent' ? 'badge-green' : entry.status === 'failed' ? 'badge-red' : 'badge-yellow'}`}>
          {entry.status}
        </span>
      </td>
      <td className="p-3 text-muted text-xs">{entry.duration_ms ? `${entry.duration_ms}ms` : '—'}</td>
      <td className="p-3 text-[10px] text-red max-w-[200px] truncate" title={entry.error ?? ''}>
        {entry.error ?? '—'}
      </td>
    </tr>
  );
};

export default function NotificationLogViewer() {
  const { 
    entries, 
    loading, 
    total, 
    page, 
    setPage, 
    filter, 
    setFilter 
  } = useNotificationLogs();

  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(prev => ({ ...prev, channel: e.target.value }));
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(prev => ({ ...prev, status: e.target.value }));
    setPage(1);
  };

  return (
    <div className="log-viewer">
      {/* Filters */}
      <div className="log-filters mb-4 flex gap-4">
        <select
          className="filter-select text-sm p-2 border rounded bg-background"
          value={filter.channel}
          onChange={handleChannelChange}
        >
          <option value="">Todos los canales</option>
          <option value="email">Email</option>
          <option value="webhook">Webhook</option>
        </select>

        <select
          className="filter-select text-sm p-2 border rounded bg-background"
          value={filter.status}
          onChange={handleStatusChange}
        >
          <option value="">Todos los estados</option>
          <option value="sent">Enviado</option>
          <option value="failed">Fallido</option>
          <option value="pending">Pendiente</option>
          <option value="skipped">Omitido</option>
        </select>

        <span className="text-muted text-sm self-center ml-auto font-medium">{total} registros</span>
      </div>

      {/* Table */}
      <div className="order-table compact glass rounded-lg overflow-hidden border border-border/40">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wider bg-muted/30">Fecha</th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wider bg-muted/30">Evento</th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wider bg-muted/30">Canal</th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wider bg-muted/30">Destinatario</th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wider bg-muted/30">Estado</th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wider bg-muted/30">Duración</th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wider bg-muted/30">Error</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center p-12 text-muted animate-pulse">Cargando registros...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-12 text-muted">Sin registros encontrados</td></tr>
            ) : entries.map((entry) => (
              <NotificationTableRow key={entry.id} entry={entry} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="log-pagination mt-6 flex justify-center items-center gap-6">
          <button 
            disabled={page <= 1} 
            onClick={() => setPage(p => p - 1)} 
            className="btn btn-sm btn-outline px-4 py-2 rounded-md border hover:bg-accent disabled:opacity-50"
          >
            ← Anterior
          </button>
          <span className="text-muted text-sm font-medium">Página {page} de {Math.ceil(total / 20)}</span>
          <button 
            disabled={page >= Math.ceil(total / 20)} 
            onClick={() => setPage(p => p + 1)} 
            className="btn btn-sm btn-outline px-4 py-2 rounded-md border hover:bg-accent disabled:opacity-50"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
