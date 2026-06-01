'use client';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { ColumnDef } from '@tanstack/react-table';
import { AdvancedDataTable } from '@/components/ui/advanced-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Eye,
    Send,
    FileText,
    Users,
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDateShort } from '@/lib/formatters';

export interface QuotationViewModel {
    id: string;
    code: string;
    brief: string;
    publicStatus: string;
    status: string;
    priceCost: number | null;
    priceTotal: number | null;
    /** Supabase returns snake_case `created_at` */
    created_at: string;
    createdAt?: string;
    client: {
        name: string;
        email: string;
    };
    service?: {
        name: string;
    } | null;
    _count?: {
        providerBids: number;
    };
    provider_suggests_technical_visit?: boolean;
}

/** Extract category name from brief like "[Categoría: iluminacion] ..." */
function extractServiceFromBrief(brief: string): string | null {
    if (!brief || typeof brief !== 'string') return null;
    const match = brief.match(/\[Categor[ií]a:\s*([^\]]+)\]/i);
    // Safe Navigation para "trim": solo lo aplica si match[1] existe de verdad.
    return match && match[1] ? match[1].trim() : null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; icon?: React.ElementType }> = {
    DRAFT: { label: 'Borrador', variant: 'neutral', icon: FileText },
    PENDING_ASSIGNMENT: { label: 'Pendiente Asignación', variant: 'neutral', icon: Clock },
    PENDING_PROVIDER_BID: { label: 'Cotizando Proveedor', variant: 'info', icon: Users },
    PENDING_ADMIN_APPROVAL: { label: 'Por Aprobar', variant: 'warning', icon: AlertCircle },
    AWAITING_CLIENT_PAYMENT: { label: 'Esperando Pago', variant: 'warning', icon: CreditCard },
    APPROVED: { label: 'Aprobada', variant: 'success', icon: CheckCircle2 },
    PAID: { label: 'Pagada', variant: 'success', icon: CreditCard },
    FULFILLED: { label: 'Completada', variant: 'success', icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelada', variant: 'error', icon: XCircle },
    REJECTED: { label: 'Rechazada', variant: 'error', icon: XCircle },
};

export const columns: ColumnDef<QuotationViewModel>[] = [
    {
        accessorKey: 'code',
        header: 'Código',
        cell: ({ row }) => {
            const dateStr = row.original.created_at || row.original.createdAt;
            return (
                <div className="flex flex-col gap-1">
                    <span className="font-mono font-medium text-foreground">{row.original.code}</span>
                    <span className="text-xs text-muted-foreground">{formatDateShort(dateStr)}</span>
                    {row.original.status === 'PENDING_ADMIN_APPROVAL' && row.original.provider_suggests_technical_visit && (
                        <Badge variant="warning" className="w-fit text-[10px] px-1.5 py-0 h-4 mt-0.5">Visita Sugerida</Badge>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'client',
        header: 'Cliente',
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-medium text-foreground">{row.original.client.name}</span>
                <span className="text-xs text-muted-foreground">{row.original.client.email}</span>
            </div>
        ),
    },
    {
        accessorKey: 'service',
        header: 'Servicio',
        cell: ({ row }) => {
            const serviceName = row.original.service?.name
                || extractServiceFromBrief(row.original.brief)
                || 'Sin servicio';
            return (
                <span className="text-foreground/80">
                    {serviceName}
                </span>
            );
        },
    },
    {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => {
            const status = STATUS_CONFIG[row.original.status] || { label: row.original.status, variant: 'neutral' };
            const Icon = status.icon;
            return (
                <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                    {Icon && <Icon className="h-3 w-3" />}
                    {status.label}
                </Badge>
            );
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id));
        },
    },
    {
        accessorKey: 'provider_bids',
        header: 'Ofertas',
        cell: ({ row }) => {
            const bids = (row.original as unknown as Record<string, unknown>).provider_bids;
            const count = Array.isArray(bids) ? bids.length : 0;
            return (
                <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{count}</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'priceTotal',
        header: () => (
            <div className="text-right">Precio</div>
        ),
        cell: ({ row }) => {
            if (!row.original.priceTotal) return <div className="text-right text-muted-foreground/50">-</div>;
            const amount = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(row.original.priceTotal);
            return (
                <div className="text-right">
                    <div className="font-medium text-foreground">{amount}</div>
                    {typeof row.original.priceCost === 'number' && row.original.priceCost > 0 && (
                        <div className="text-xs text-muted-foreground">
                            Costo: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(row.original.priceCost)}
                        </div>
                    )}
                </div>
            );
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            return <ActionsCell quotation={row.original} />;
        },
    },
];

/** Provider shape from /api/providers */
interface Provider {
    id: string;
    name: string;
    email: string;
}

/**
 * Extracted as a component so we can use React hooks (useState)
 * inside a table cell for provider selection.
 */
function ActionsCell({ quotation }: { quotation: QuotationViewModel }) {
    const router = useRouter();
    const [showProviders, setShowProviders] = useState(false);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(false);
    const [sending, setSending] = useState(false);

    const handleOpenProviderSelect = async () => {
        setShowProviders(true);
        setLoadingProviders(true);
        try {
            const res = await fetch('/api/providers');
            if (res.ok) {
                const data = await res.json();
                setProviders(data);
            } else {
                toast.error('Error al cargar proveedores');
            }
        } catch {
            toast.error('Error de conexión');
        } finally {
            setLoadingProviders(false);
        }
    };

    const handleAssignAndSend = async (providerId: string) => {
        setSending(true);
        try {
            const response = await fetch(`/api/quotations/${quotation.id}/transition`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    toStatus: 'PENDING_PROVIDER_BID',
                    assignedProviderId: providerId,
                }),
            });

            if (response.ok) {
                toast.success('Proveedor asignado y cotización enviada');
                // Use router.refresh() instead of hard reload so the DOM doesn't get wiped
                // before the E2E Test (or user) can read the Toast.
                router.refresh();
            } else {
                const errorData = await response.json().catch(() => null);
                const errorMsg = errorData?.error || `Error ${response.status}`;
                toast.error(`Error: ${errorMsg}`);
                logger.error('[QuotationsTable] Transition error:', response.status, errorData);
            }
        } catch (err) {
            logger.error('[QuotationsTable] Network error:', err);
            toast.error('Error de conexión');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex justify-end gap-2 relative">
            {quotation.status === 'PENDING_ASSIGNMENT' && (
                <>
                    {!showProviders ? (
                        <Button size="sm" variant="outline" onClick={handleOpenProviderSelect} title="Asignar Proveedor">
                            <Send className="h-4 w-4 text-blue-600" />
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1">
                            {loadingProviders ? (
                                <span className="text-xs text-muted-foreground animate-pulse">Cargando...</span>
                            ) : providers.length === 0 ? (
                                <span className="text-xs text-destructive">Sin proveedores</span>
                            ) : (
                                <select
                                    className="text-xs border rounded px-2 py-1 bg-background text-foreground"
                                    defaultValue=""
                                    disabled={sending}
                                    onChange={(e) => {
                                        if (e.target.value) handleAssignAndSend(e.target.value);
                                    }}
                                >
                                    <option value="" disabled>Elegir proveedor...</option>
                                    {providers.map((p) => {
                                        const pName = p.name ? p.name.trim() : 'Sin Nombre';
                                        const pEmail = p.email ? p.email.trim() : 'Sin Email';
                                        return (
                                            <option key={p.id} value={p.id}>{pName} ({pEmail})</option>
                                        );
                                    })}
                                </select>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => setShowProviders(false)} className="h-6 w-6 p-0">
                                ✕
                            </Button>
                        </div>
                    )}
                </>
            )}
            <Button size="sm" variant="ghost" asChild>
                <Link href={`/admin/quotations/${quotation.id}`}>
                    <Eye className="h-4 w-4 text-muted-foreground hover:text-indigo-600 transition-colors" />
                </Link>
            </Button>
        </div>
    );
}

export function QuotationsTable({ data }: { data: QuotationViewModel[] }) {
    return (
        <AdvancedDataTable
            columns={columns}
            data={data}
            filterColumn="client" // Search by client name
            filterPlaceholder="Buscar cliente..."
            facetedFilters={[
                {
                    column: 'status',
                    title: 'Estado',
                    options: Object.entries(STATUS_CONFIG).map(([key, config]) => ({
                        label: config.label,
                        value: key,
                    })),
                },
            ]}
        />
    );
}
