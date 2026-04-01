import { getCachedClientRecentQuotes } from '@/actions/dashboard';
import { DashboardTable } from '@/components/dashboard/dashboard-table';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/quotations/status-badge';
import { formatCLP } from '@/lib/formatters';
import Link from 'next/link';

export async function ClientRecentQuotes({ userId }: { userId: string }) {
    const quotes = await getCachedClientRecentQuotes(userId);

    return (
        <BentoGrid className="lg:grid-cols-1">
            <BentoGridItem span="row">
                <DashboardTable
                    title="Cotizaciones Recientes"
                    subtitle="Historial de tus solicitudes"
                    actionLabel="Ver todas"
                    actionHref="/client/quotations"
                    data={quotes}
                    emptyMessage="No has realizado cotizaciones aún."
                    columns={[
                        {
                            header: "Servicio",
                            accessor: (quote) => (
                                <>
                                    <div className="font-medium text-foreground">{quote.service.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{quote.code}</div>
                                </>
                            )
                        },
                        {
                            header: "Fecha",
                            accessor: (quote) => (
                                <span className="text-muted-foreground text-xs">
                                    {new Date(quote.createdAt).toLocaleDateString('es-CL')}
                                </span>
                            )
                        },
                        {
                            header: "Monto Total",
                            accessor: (quote) => (
                                <span className="font-mono font-semibold tabular-nums text-foreground">
                                    {quote.priceTotal && ['COTIZADA', 'APPROVED', 'PAID', 'IN_PRODUCTION'].includes(quote.publicStatus)
                                        ? formatCLP(quote.priceTotal)
                                        : <span className="text-muted-foreground font-normal italic">--</span>}
                                </span>
                            )
                        },
                        {
                            header: "Estado",
                            accessor: (quote) => <StatusBadge status={quote.publicStatus} />
                        },
                        {
                            header: "Acción",
                            className: "text-right",
                            accessor: (quote) => (
                                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50" asChild>
                                    <Link href={`/client/quotations/${quote.id}`}>
                                        Ver Detalle
                                    </Link>
                                </Button>
                            )
                        }
                    ]}
                />
            </BentoGridItem>
        </BentoGrid>
    );
}
