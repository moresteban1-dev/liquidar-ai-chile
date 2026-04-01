// ============================================================
// components/admin/ManualTransferReview.tsx
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { Payment } from '@/types/payments';
import { Loader2, CheckCircle, XCircle, FileText, Calendar, User, ExternalLink, Building2 } from 'lucide-react';
import { toast } from 'sonner';

// Helper for formatting CLP
const formatCLP = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
    }).format(amount);
};

export function ManualTransferReview() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingTransfers();
    }, []);

    async function fetchPendingTransfers() {
        try {
            // Filtrar solo las que requieren revisión
            const res = await fetch('/api/admin/payments?gateway=manual_transfer&status=pending_review');
            const data = await res.json();
            setPayments(data.payments || []);
        } catch {
            toast.error('Error cargando transferencias');
        } finally {
            setLoading(false);
        }
    }

    async function handleReview(paymentId: string, action: 'approve' | 'reject') {
        if (!confirm(`¿Estás seguro de ${action === 'approve' ? 'APROBAR' : 'RECHAZAR'} este pago?`)) return;

        setProcessingId(paymentId);
        try {
            const res = await fetch('/api/payments/manual/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment_id: paymentId,
                    action,
                    notes: action === 'approve' ? 'Aprobado manualmente' : 'Rechazado por admin',
                }),
            });

            if (!res.ok) throw new Error('Error en la operación');

            toast.success(`Pago ${action === 'approve' ? 'aprobado' : 'rechazado'}`);
            // Remove from list
            setPayments(prev => prev.filter(p => p.id !== paymentId));
        } catch {
            toast.error('Fallo al procesar la revisión');
        } finally {
            setProcessingId(null);
        }
    }

    if (loading) return <div className="flex p-8 justify-center"><Loader2 className="animate-spin" /></div>;

    if (payments.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed text-gray-500">
                No hay transferencias pendientes de revisión.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6" /> Revisiones Pendientes
            </h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {payments.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="bg-blue-50 px-4 py-3 border-b flex justify-between items-center">
                            <span className="font-mono text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                #{p.order_id.substring(0, 8)}
                            </span>
                            <span className="font-bold text-gray-900">{formatCLP(p.amount)}</span>
                        </div>

                        {/* Body */}
                        <div className="p-4 space-y-3 flex-1">
                            {/* Receipt Preview */}
                            {p.metadata.transfer_receipt_url ? (
                                <div className="relative group rounded-lg overflow-hidden border bg-gray-100 h-32 flex items-center justify-center">
                                    {p.metadata.transfer_receipt_url.endsWith('.pdf') ? (
                                        <div className="text-center">
                                            <FileText className="w-8 h-8 text-red-500 mx-auto" />
                                            <a
                                                href={p.metadata.transfer_receipt_url}
                                                target="_blank"
                                                className="text-xs text-blue-600 hover:underline mt-1 block"
                                            >
                                                Ver PDF
                                            </a>
                                        </div>
                                    ) : (
                                        <a href={p.metadata.transfer_receipt_url} target="_blank">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={p.metadata.transfer_receipt_url}
                                                alt="Comprobante"
                                                className="object-cover w-full h-full group-hover:opacity-90 transition-opacity cursor-zoom-in"
                                            />
                                        </a>
                                    )}
                                    <a
                                        href={p.metadata.transfer_receipt_url}
                                        target="_blank"
                                        className="absolute top-2 right-2 bg-white/80 p-1 rounded-full shadow hover:bg-white"
                                        title="Abrir en nueva pestaña"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            ) : (
                                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                                    Sin comprobante
                                </div>
                            )}

                            {/* Details */}
                            <div className="text-sm space-y-1">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <User size={14} className="text-gray-400" />
                                    <span className="font-medium">{p.metadata.sender_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded border">RUT</span>
                                    <span>{p.metadata.sender_rut}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Building2 size={14} className="text-gray-400" />
                                    <span>{p.metadata.sender_bank}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 text-xs">
                                    <Calendar size={12} />
                                    <span>{new Date(p.metadata.transfer_date as string || '').toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-3 bg-gray-50 border-t grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleReview(p.id, 'reject')}
                                disabled={processingId === p.id}
                                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 text-sm font-medium"
                            >
                                <XCircle size={16} /> Rechazar
                            </button>
                            <button
                                onClick={() => handleReview(p.id, 'approve')}
                                disabled={processingId === p.id}
                                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                            >
                                {processingId === p.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                Aprobar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
