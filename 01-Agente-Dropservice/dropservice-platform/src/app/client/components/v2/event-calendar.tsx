'use client';

/**
 * EventCalendar — Monthly calendar view of client events.
 *
 * Pure client component — receives events from server, renders a mini calendar
 * with colored dots per day and event details on hover/click.
 */

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCLP } from '@/lib/formatters';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CalendarEvent {
    id: string;
    code: string;
    serviceName: string;
    eventDate: string;
    status: string;
    publicStatus: string;
    amount: number;
}

interface EventCalendarProps {
    events: CalendarEvent[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const STATUS_COLORS: Record<string, string> = {
    PENDING_ASSIGNMENT: 'bg-yellow-400',
    PENDING_PROVIDER_BID: 'bg-yellow-400',
    PENDING_ADMIN_APPROVAL: 'bg-blue-400',
    AWAITING_CLIENT_PAYMENT: 'bg-amber-400',
    APPROVED: 'bg-green-400',
    PAID: 'bg-green-500',
    FULFILLED: 'bg-emerald-500',
    COMPLETED: 'bg-emerald-600',
};

// ─── Component ──────────────────────────────────────────────────────────────

export function EventCalendar({ events }: EventCalendarProps) {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth());
    const [year, setYear] = useState(today.getFullYear());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    // Group events by date key (YYYY-MM-DD)
    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        for (const ev of events) {
            const dateStr = ev.eventDate || '';
            const key = dateStr.split('T')[0] || '';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(ev);
        }
        return map;
    }, [events]);

    // Calendar grid
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7; // Monday-first
    const daysInMonth = lastDay.getDate();

    const navigate = (dir: number) => {
        const d = new Date(year, month + dir, 1);
        setMonth(d.getMonth());
        setYear(d.getFullYear());
        setSelectedDay(null);
    };

    const selectedDateKey = selectedDay
        ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
        : null;

    const selectedEvents = selectedDateKey ? eventsByDate.get(selectedDateKey) ?? [] : [];

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-semibold text-foreground">Calendario de Eventos</h3>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-32 text-center">
                        {MONTHS[month]} {year}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS.map(d => (
                    <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startPad }).map((_, i) => (
                    <div key={`pad-${i}`} className="h-10" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayEvents = eventsByDate.get(dateKey) ?? [];
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    const isSelected = day === selectedDay;

                    return (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                            className={`h-10 rounded-lg flex flex-col items-center justify-center relative transition-colors text-sm
                                ${isToday ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-foreground'}
                                ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/40 ring-1 ring-indigo-400' : 'hover:bg-muted/30'}
                            `}
                        >
                            {day}
                            {dayEvents.length > 0 && (
                                <div className="flex gap-0.5 mt-0.5">
                                    {dayEvents.slice(0, 3).map((ev, idx) => (
                                        <span
                                            key={idx}
                                            className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[ev.status] ?? 'bg-gray-400'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Selected day events */}
            {selectedDay && (
                <div className="mt-4 border-t border-border pt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        {selectedDay} de {MONTHS[month]}
                    </p>
                    {selectedEvents.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60">Sin eventos este día</p>
                    ) : (
                        selectedEvents.map(ev => (
                            <Link
                                key={ev.id}
                                href={`/client/quotations/${ev.id}`}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20 transition-colors"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{ev.serviceName}</p>
                                    <span className="font-mono text-[10px] text-muted-foreground">{ev.code}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="neutral" className="text-[10px]">{ev.publicStatus}</Badge>
                                    {ev.amount > 0 && (
                                        <span className="text-xs font-mono font-semibold">{formatCLP(ev.amount)}</span>
                                    )}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
