/**
 * Upcoming Events V2 — Client's upcoming events with countdown timers.
 */
import { getClientUpcomingEvents } from '@/lib/dashboard/client-data.service';
import { formatCLP, formatDateShort } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const PUBLIC_STATUS_LABELS: Record<string, string> = {
    EN_PROCESO: 'En Proceso',
    COTIZADA: 'Cotizada',
    APROBADA: 'Aprobada',
    PAGADA: 'Pagada',
};

interface UpcomingEventsProps {
    userId: string;
}

export async function UpcomingEvents({ userId }: UpcomingEventsProps) {
    const events = await getClientUpcomingEvents(userId);

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Próximos Eventos</h3>
                    <p className="text-sm text-muted-foreground">{events.length} eventos programados</p>
                </div>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No tienes eventos programados próximamente.</p>
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                        <Link href="/client/quotations/request">Cotizar mi Evento</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                {/* Countdown circle */}
                                <div className={`flex flex-col items-center justify-center h-12 w-12 rounded-xl shrink-0 ${event.daysUntil <= 7
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                    }`}>
                                    <span className="text-lg font-bold tabular-nums leading-none">{event.daysUntil}</span>
                                    <span className="text-[9px] font-semibold uppercase tracking-wider">días</span>
                                </div>

                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{event.serviceName}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-muted-foreground">
                                            {formatDateShort(event.eventDate)}
                                        </span>
                                        <span className="font-mono text-xs text-muted-foreground">{event.code}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-sm font-mono font-semibold tabular-nums text-foreground hidden sm:block">
                                    {event.amount > 0 ? formatCLP(event.amount) : '--'}
                                </span>
                                <Badge variant={
                                    event.status === 'AWAITING_CLIENT_PAYMENT' ? 'warning' : 'success'
                                }>
                                    {event.status === 'AWAITING_CLIENT_PAYMENT'
                                        ? 'Pago Pendiente'
                                        : PUBLIC_STATUS_LABELS[event.publicStatus] ?? event.publicStatus}
                                </Badge>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                                    <Link href={`/client/quotations/${event.id}`}>
                                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
