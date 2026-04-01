/**
 * CompletedEvents V2 — Completed events with re-quote CTA.
 * Server Component that fetches data, renders RequoteButton (Client Component).
 */
import { getClientCompletedEvents } from '@/lib/dashboard/client-data.service';
import { formatCLP } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { RequoteButton } from './requote-button';
import { EventFeedback } from './event-feedback';
import Link from 'next/link';

interface CompletedEventsProps {
    userId: string;
}

export async function CompletedEvents({ userId }: CompletedEventsProps) {
    const events = await getClientCompletedEvents(userId);

    if (events.length === 0) return null;

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Eventos Realizados</h3>
                    <p className="text-sm text-muted-foreground">¿Quieres repetir un evento? Re-cotiza en un clic</p>
                </div>
            </div>

            <div className="space-y-3">
                {events.map((event) => (
                    <div
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 shrink-0">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{event.serviceName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="font-mono text-xs text-muted-foreground">{event.code}</span>
                                    {event.eventDate && (
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(event.eventDate).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-mono font-semibold tabular-nums text-foreground hidden sm:block">
                                {event.amount > 0 ? formatCLP(event.amount) : '--'}
                            </span>
                            <RequoteButton quotation={event} />
                            <EventFeedback quotationId={event.id} serviceName={event.serviceName} />
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                                <Link href={`/client/quotations/${event.id}`}>
                                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
