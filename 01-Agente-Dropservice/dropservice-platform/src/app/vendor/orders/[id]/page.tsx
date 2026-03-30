"use client";

import { useVendorOrder } from './use-vendor-order';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatCLP, formatBytes } from '@/lib/formatters';

export default function VendorOrderDetailPage() {
    const params = useParams();
    const orderId = params.id as string;

    const {
        order,
        loading,
        uploading,
        files,
        message,
        handleFileUpload,
        handleMarkComplete
    } = useVendorOrder(orderId);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-muted-foreground">Cargando orden...</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-red-500">Orden no encontrada</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-card border-b border-border px-8 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <Link href="/vendor/orders" className="text-sm text-muted-foreground hover:text-foreground">
                            ← Volver a Mis Trabajos
                        </Link>
                        <h1 className="text-2xl font-bold text-foreground mt-1">{order.code}</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{formatCLP(order.priceCost)}</p>
                        <p className="text-sm text-muted-foreground">Tu pago</p>
                    </div>
                </div>
            </header>

            <main className="p-8 max-w-4xl mx-auto">
                {message && (
                    <div className={`mb-6 p-4 rounded-xl text-sm ${message.includes('correctamente') || message.includes('entregado')
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Brief */}
                <section className="bg-card rounded-xl border border-border p-6 mb-6">
                    <h2 className="font-semibold text-foreground mb-3">📋 Brief del Proyecto</h2>
                    <p className="text-muted-foreground">{order.quotation?.brief}</p>
                    {order.quotation?.requirements && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium text-foreground/80 mb-2">Requisitos:</p>
                            <p className="text-sm text-muted-foreground">{order.quotation.requirements}</p>
                        </div>
                    )}
                </section>

                {/* Logistics Checklist (Field Ops) */}
                <section className="bg-card rounded-xl border border-border p-6 mb-6">
                    <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        📦 Checklist Logístico
                    </h2>
                    <div className="space-y-3">
                        {order.items?.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                                <div>
                                    <p className="font-medium text-foreground">{item.service.name}</p>
                                    <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 rounded border-border text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm text-muted-foreground">Check</span>
                                </label>
                            </div>
                        ))}
                        {(!order.items || order.items.length === 0) && (
                            <p className="text-muted-foreground text-sm">No hay ítems registrados para logística.</p>
                        )}
                    </div>
                </section>

                {/* File Upload */}
                <section className="bg-card rounded-xl border border-border p-6 mb-6">
                    <h2 className="font-semibold text-foreground mb-4">📁 Archivos Entregables</h2>

                    {/* Upload input */}
                    <div className="mb-6">
                        <label className="block">
                            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="hidden"
                                />
                                {uploading ? (
                                    <p className="text-muted-foreground">Subiendo...</p>
                                ) : (
                                    <>
                                        <p className="text-muted-foreground mb-2">Arrastra archivos o haz clic para subir</p>
                                        <p className="text-sm text-muted-foreground/70">Máx 10MB • PDF, ZIP, imágenes, videos</p>
                                    </>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* File list */}
                    {files.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No hay archivos subidos</p>
                    ) : (
                        <ul className="space-y-2">
                            {files.map((file, index) => (
                                <li key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">📄</span>
                                        <div>
                                            <p className="font-medium text-foreground">{file.name}</p>
                                            <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        Descargar
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Actions */}
                {['PAID', 'IN_PRODUCTION', 'UNDER_REVIEW'].includes(order.status) && (
                    <div className="flex justify-end">
                        <button
                            onClick={handleMarkComplete}
                            disabled={files.length === 0}
                            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-muted disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
                        >
                            ✓ Marcar como Entregado
                        </button>
                    </div>
                )}

                {order.status === 'INTERNAL_REVIEW' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                        <p className="text-yellow-700 font-medium">⏳ En revisión por el administrador</p>
                    </div>
                )}
            </main>
        </div>
    );
}
