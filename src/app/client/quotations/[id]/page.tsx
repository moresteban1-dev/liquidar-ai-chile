'use client';

import { use } from 'react';
import { useQuotationDetails } from './use-quotation-details';
import Link from 'next/link';
import { StatusBadge } from '@/components/quotations/status-badge';
import { DownloadQuoteButton } from '@/components/quotations/DownloadQuoteButton';
import { formatCLP } from '@/lib/quotation-fsm';
import { Button } from '@/components/ui/button';
import { formatDate, parseRequirements } from '@/lib/utils';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { ManualTransferForm } from '@/components/checkout/ManualTransferForm';
import { BankAccountData } from '@/types/payments';
import { EventTimeline } from '../../components/v2/event-timeline';
import { EventChecklist } from '../../components/v2/event-checklist';

export default function ClientQuotationDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const {
        quotation,
        clientItems,
        loading,
        error,
        selectedGateway,
        setSelectedGateway,
        paymentResponse,
        paymentCreating,
        handlePay
    } = useQuotationDetails(id);

    if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando detalles...</div>;

    if (error) return (
        <div>
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">{error}</div>
            <Link href="/client/quotations" className="text-indigo-500 hover:underline">Volver al listado</Link>
        </div>
    );

    if (!quotation) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Link href="/client/quotations" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
                        ← Volver a Mis Cotizaciones
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        Solicitud {quotation.code}
                        <StatusBadge status={quotation.publicStatus} />
                    </h1>

                    <p className="text-muted-foreground">
                        Creada el {formatDate(quotation.createdAt as string)}
                    </p>
                </div>
                <DownloadQuoteButton
                    quotation={quotation}
                    clientItems={clientItems}
                />
            </div>

            {/* Timeline Visual */}
            <EventTimeline
                currentStatus={quotation.status}
                createdAt={quotation.createdAt as string}
            />

            {/* Checklist Pre-Evento (solo para eventos confirmados) */}
            {['APPROVED', 'PAID', 'AWAITING_CLIENT_PAYMENT'].includes(quotation.status) && (
                <EventChecklist quotationId={id} />
            )}

            <div id="quotation-printable-area" className="space-y-6">
                {/* Event Logistics */}
                {(Boolean(quotation.eventStartDate) || Boolean(quotation.eventLocation) || Boolean(quotation.eventAddress)) && (
                    <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
                            📍 Logística del Evento
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Boolean(quotation.eventAddress || quotation.eventLocation) && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Dirección / Lugar</p>
                                    <p className="font-medium text-foreground">{(quotation.eventAddress || quotation.eventLocation) as string}</p>
                                </div>
                            )}
                            {Boolean(quotation.eventTime) && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Hora Inicio</p>
                                    <p className="font-medium text-foreground">{quotation.eventTime as string}</p>
                                </div>
                            )}
                            {Boolean(quotation.setupTime) && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Horario Montaje</p>
                                    <p className="font-medium text-foreground">{quotation.setupTime as string}</p>
                                </div>
                            )}
                            {Boolean(quotation.teardownTime) && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Horario Desmontaje</p>
                                    <p className="font-medium text-foreground">{quotation.teardownTime as string}</p>
                                </div>
                            )}
                            {Boolean(quotation.eventEndDate) && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Hora de Término</p>
                                    <p className="font-medium text-foreground">
                                        {formatDate(quotation.eventEndDate as string)}
                                    </p>
                                </div>
                            )}
                            {Boolean(quotation.eventStartDate) && (
                                <div className="md:col-span-2">
                                    <p className="text-sm text-muted-foreground mb-1">Fechas</p>
                                    <p className="font-medium text-foreground">
                                        Del {formatDate(quotation.eventStartDate as string)} al {formatDate(quotation.eventEndDate as string)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Service Card */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
                        Servicio Solicitado
                    </h2>
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <h3 className="font-medium text-foreground text-lg">{(quotation.service as { name?: string; description?: string })?.name || "Servicio Personalizado"}</h3>
                            <p className="text-muted-foreground text-sm mt-1">{(quotation.service as { name?: string; description?: string })?.description || "Detalles en brief."}</p>
                        </div>
                    </div>
                </div>

                {/* Requirements Card */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
                        Tus Requerimientos
                    </h2>
                    <div className="prose prose-slate max-w-none">
                        {(() => {
                            const { text, tags } = parseRequirements(quotation.brief);
                            return (
                                <>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {tags.map((tag: string, i: number) => (
                                            <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="whitespace-pre-wrap text-foreground/80 bg-muted/50 p-4 rounded-lg border border-border">
                                        {text}
                                    </p>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Transfer Details Manual Receipt Form */}
                {paymentResponse && paymentResponse.bank_data ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 animate-in fade-in slide-in-from-top-4">
                        <ManualTransferForm
                            bankData={paymentResponse.bank_data as BankAccountData}
                            paymentId={paymentResponse.payment_id as string}
                            amount={quotation.priceTotal || 0}
                            orderId={quotation.id}
                            onReceiptUploaded={() => {
                                alert('Comprobante enviado exitosamente');
                                window.location.reload();
                            }}
                        />
                    </div>
                ) : null}

                {/* Itemized Lines */}
                {clientItems.length > 0 && (
                    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
                            📋 Detalle de la Cotización
                        </h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-muted-foreground border-b">
                                    <th className="text-left p-2">Concepto</th>
                                    <th className="text-center p-2">Cant.</th>
                                    <th className="text-right p-2">P. Unitario</th>
                                    <th className="text-right p-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientItems.map((item) => (
                                    <tr key={item.id} className="border-b border-border/50">
                                        <td className="p-2">{item.description}</td>
                                        <td className="p-2 text-center">{item.quantity}</td>
                                        <td className="p-2 text-right">{formatCLP(item.unit_price_net)}</td>
                                        <td className="p-2 text-right font-medium">{formatCLP(item.total_price_net)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pricing Section */}
                {(quotation.publicStatus === 'COTIZADA' || quotation.publicStatus === 'APPROVED' || quotation.status === 'AWAITING_CLIENT_PAYMENT') && !paymentResponse && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-sm border border-blue-100 p-6">
                        <h2 className="text-lg font-semibold text-indigo-900 mb-4 border-b border-blue-200 pb-2">
                            Propuesta Económica
                        </h2>
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-sm text-indigo-700">Precio Neto</p>
                                <p className="text-sm text-indigo-700">IVA (19%)</p>
                                <p className="text-xl font-bold text-indigo-900 mt-2">Total</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-sm font-medium text-foreground/80">
                                    {formatCLP(quotation.priceNet || 0)}
                                </p>
                                <p className="text-sm font-medium text-foreground/80">
                                    {formatCLP(quotation.priceIva || 0)}
                                </p>
                                <p className="text-2xl font-bold text-indigo-600">
                                    {formatCLP(quotation.priceTotal || 0)}
                                </p>
                            </div>
                        </div>

                        {(quotation.publicStatus === 'COTIZADA' || quotation.status === 'AWAITING_CLIENT_PAYMENT') && (
                            <div className="mt-8 pt-6 border-t border-blue-200">
                                <PaymentMethodSelector selected={selectedGateway} onSelect={setSelectedGateway} />

                                <div className="mt-6 flex justify-end gap-3">
                                    {quotation.publicStatus === 'COTIZADA' && (
                                        <button
                                            onClick={async () => {
                                                if (!confirm('¿Estás seguro de rechazar?')) return;
                                                // ... call reject action
                                            }}
                                            className="px-6 py-2 bg-white border border-red-200 text-red-700 font-medium rounded-lg hover:bg-red-50 transition-colors">
                                            Rechazar
                                        </button>
                                    )}

                                    <Button
                                        onClick={handlePay}
                                        disabled={!selectedGateway || paymentCreating}
                                        loading={paymentCreating}
                                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all">
                                        {quotation.publicStatus === 'COTIZADA' ? 'Aprobar y Pagar' : 'Pagar Ahora'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State / Status Message */}
                {quotation.publicStatus === 'RECIBIDA' && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex gap-3">
                        <span className="text-lg">ℹ️</span>
                        <div>
                            <p className="font-semibold">Solicitud Recibida</p>
                            <p>Hemos recibido tus requerimientos. Un experto analizará tu solicitud y te enviaremos una propuesta detallada en breve.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
