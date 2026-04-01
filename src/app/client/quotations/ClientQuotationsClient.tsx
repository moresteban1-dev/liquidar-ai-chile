'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/quotations/status-badge';
import { QuotationPublicStatus } from '@/lib/types';
import { ClipboardList, Plus, Eye, Calendar, Package } from 'lucide-react';
import Image from 'next/image';

interface QuotationSummary {
    id: string;
    code: string;
    publicStatus: QuotationPublicStatus;
    createdAt: string;
    priceTotal?: number | null;
    brief?: string | null;
    service: {
        name: string;
        imageUrl: string | null;
    };
}

export function ClientQuotationsClient({ quotations }: { quotations: QuotationSummary[] }) {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Mis Cotizaciones</h1>
                    <p className="text-muted-foreground">Revisa el estado de tus solicitudes</p>
                </div>
                <Button asChild>
                    <Link href="/#services">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Solicitud
                    </Link>
                </Button>
            </div>

            {/* Quotations List/Table */}
            {quotations.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Aún no tienes cotizaciones</h3>
                        <p className="text-muted-foreground mb-6">Explora nuestros servicios y solicita tu primera cotización hoy.</p>
                        <Button variant="link" asChild>
                            <Link href="/#services">
                                Ver Catálogo de Servicios
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Código</th>
                                        <th className="px-6 py-4">Servicio</th>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {quotations.map((quote) => (
                                        <tr key={quote.id} className="hover:bg-accent/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-foreground/70">{quote.code}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {quote.service.imageUrl ? (
                                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                                                            <Image
                                                                src={quote.service.imageUrl}
                                                                alt=""
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                                            <Package className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-foreground">{quote.service.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(quote.createdAt).toLocaleDateString('es-CL')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={quote.publicStatus} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/client/quotations/${quote.id}`}>
                                                        <Eye className="mr-1 h-4 w-4" /> Ver Detalles
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
