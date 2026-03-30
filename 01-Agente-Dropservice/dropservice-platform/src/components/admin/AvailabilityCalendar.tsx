'use client';

/**
 * Logistics Calendar Component
 * Visualizes equipment usage over a 30-day timeline.
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    status: string;
    resource: string;
}

const STATUS_COLORS: Record<string, string> = {
    PAID: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    IN_PRODUCTION: 'bg-blue-100 text-blue-800 border-blue-200',
    UNDER_REVIEW: 'bg-purple-100 text-purple-800 border-purple-200',
    DELIVERED: 'bg-orange-100 text-orange-800 border-orange-200',
    COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    COMPLETADA: 'bg-green-100 text-green-800 border-green-200',
};

export function AvailabilityCalendar() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/admin/calendar');
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            logger.error('Error fetching calendar:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper: generate dates for view (e.g., 14 days)
    const getDates = () => {
        const days = [];
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay() + 1); // Start on Monday

        for (let i = 0; i < 14; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const upcomingDates = getDates();

    const moveWeek = (direction: 'next' | 'prev') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const isEventOnDate = (event: CalendarEvent, date: Date) => {
        const start = new Date(event.start);
        const end = new Date(event.end || event.start);

        // Normalize time to compare dates only
        const check = new Date(date).setHours(0, 0, 0, 0);
        const eStart = new Date(start).setHours(0, 0, 0, 0);
        const eEnd = new Date(end).setHours(0, 0, 0, 0);

        return check >= eStart && check <= eEnd;
    };

    if (loading) return <Skeleton className="h-96 w-full" />;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Calendario de Disponibilidad</CardTitle>
                        <CardDescription>Visualiza la ocupación de equipos</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon-sm" onClick={() => moveWeek('prev')}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-medium min-w-32 text-center">
                            {upcomingDates[0].toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                        </span>
                        <Button variant="outline" size="icon-sm" onClick={() => moveWeek('next')}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <div className="min-w-[1000px]">
                    {/* Header Row */}
                    <div className="grid grid-cols-[250px_repeat(14,1fr)] bg-slate-50 border-y border-slate-200">
                        <div className="p-3 font-medium text-slate-500 text-sm">Evento / Recurso</div>
                        {upcomingDates.map((date, i) => (
                            <div key={i} className={`p-2 text-center border-l border-slate-200 ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-slate-100' : ''}`}>
                                <div className="text-xs font-semibold text-slate-700">{date.toLocaleDateString('es-CL', { weekday: 'short' })}</div>
                                <div className="text-sm font-bold text-slate-900">{date.getDate()}</div>
                            </div>
                        ))}
                    </div>

                    {/* Events Rows */}
                    <div className="divide-y divide-slate-100">
                        {events.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No hay eventos programados en este período</div>
                        ) : (
                            events.map(event => (
                                <div key={event.id} className="grid grid-cols-[250px_repeat(14,1fr)] hover:bg-slate-50 transition-colors group">
                                    <div className="p-3 border-r border-slate-100">
                                        <div className="font-medium text-sm text-slate-900 truncate" title={event.title}>{event.title}</div>
                                        <div className="text-xs text-slate-500 truncate" title={event.resource}>{event.resource}</div>
                                    </div>
                                    {upcomingDates.map((date, i) => {
                                        const active = isEventOnDate(event, date);
                                        return (
                                            <div key={i} className={`border-r border-slate-100 relative h-16 ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-slate-50/50' : ''}`}>
                                                {active && (
                                                    <div className={`absolute inset-x-0 top-2 bottom-2 mx-1 rounded-md border text-xs flex items-center justify-center font-medium shadow-sm ${STATUS_COLORS[event.status] || 'bg-slate-200'}`}>
                                                        {event.status.substring(0, 3)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
