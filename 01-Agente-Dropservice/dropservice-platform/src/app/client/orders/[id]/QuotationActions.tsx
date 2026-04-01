'use client';

/**
 * Client Component — Quotation approve/reject buttons.
 * This is the ONLY interactive JS for the order detail page.
 * Uses Server Actions or API for mutation.
 */

import { useTransition } from 'react';
import { toast } from 'sonner';

interface QuotationActionsProps {
  quotationId: string;
}

export default function QuotationActions({
  quotationId,
}: QuotationActionsProps) {
  const [isPending, startTransition] = useTransition();

  async function handleApprove() {
    if (!confirm('¿Estás seguro de que deseas aprobar esta cotización?')) return;
    
    startTransition(async () => {
      try {
        const res = await fetch(`/api/quotations/${quotationId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          toast.success('¡Cotización aprobada! Procediendo al pago...');
          window.location.reload();
        } else {
          const data = await res.json();
          toast.error(data.error || 'Error al aprobar');
        }
      } catch (error) {
        toast.error('Error de conexión');
      }
    });
  }

  async function handleReject() {
    const reason = prompt('¿Motivo del rechazo?');
    if (!reason) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/quotations/${quotationId}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });

        if (res.ok) {
          toast.success('Cotización rechazada');
          window.location.reload();
        } else {
          const data = await res.json();
          toast.error(data.error || 'Error al rechazar');
        }
      } catch (error) {
        toast.error('Error de conexión');
      }
    });
  }

  return (
    <div className="quotation-actions flex gap-3 mt-4">
      <button
        onClick={handleApprove}
        disabled={isPending}
        className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50"
      >
        {isPending ? 'Procesando...' : '✅ Aprobar Cotización'}
      </button>
      <button
        onClick={handleReject}
        disabled={isPending}
        className="py-3 px-6 bg-muted hover:bg-muted/80 text-foreground/80 rounded-xl font-semibold transition-all disabled:opacity-50"
      >
        {isPending ? '...' : '❌ Rechazar'}
      </button>
    </div>
  );
}
