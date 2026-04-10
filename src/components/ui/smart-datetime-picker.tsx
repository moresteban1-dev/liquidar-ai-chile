'use client';

/**
 * SmartDatetimePicker — Stack-Aligned Components
 *
 * Uses platform primitives:
 * - Calendar (react-day-picker) for date grid
 * - Popover (Radix UI) for dropdown
 * - Button (CVA) for quick actions
 * - Design tokens from globals.css
 *
 * Exports: SmartDatePicker, SmartTimePicker
 */

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

// ==========================================
// SEGMENTED INPUT STYLES (Platform-aligned)
// ==========================================
const SEGMENT_INPUT_CLASSES = cn(
    "w-8 bg-transparent border-none text-center outline-none",
    "placeholder:text-muted-foreground/50",
    "selection:bg-indigo-100 selection:text-indigo-900",
    "focus:ring-0"
);

// ==========================================
// SMART DATE PICKER
// ==========================================
interface SmartDatePickerProps {
    value: string; // ISO Date "YYYY-MM-DD" or empty
    onChange: (value: string) => void;
    className?: string;
}

export function SmartDatePicker({ value, onChange, className }: SmartDatePickerProps) {
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [calendarOpen, setCalendarOpen] = useState(false);

    const dayRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);

    // Sync internal state when external value changes
    useEffect(() => {
        if (value) {
            const date = new Date(value + 'T00:00:00');
            if (!isNaN(date.getTime())) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setDay(String(date.getDate()).padStart(2, '0'));
                setMonth(String(date.getMonth() + 1).padStart(2, '0'));
                setYear(String(date.getFullYear()));
            }
        } else {
            setDay('');
            setMonth('');
            setYear('');
        }
    }, [value]);

    const validateAndEmit = (d: string, m: string, y: string) => {
        if (d.length === 2 && m.length === 2 && y.length === 4) {
            const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            if (date.getDate() === parseInt(d) && date.getMonth() === parseInt(m) - 1) {
                onChange(`${y}-${m}-${d}`);
            }
        }
    };

    const handleDayInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (parseInt(val) > 31) val = '31';
        setDay(val);
        if (val.length === 2) {
            monthRef.current?.focus();
            monthRef.current?.select();
        }
        validateAndEmit(val, month, year);
    };

    const handleMonthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (parseInt(val) > 12) val = '12';
        setMonth(val);
        if (val.length === 2) {
            yearRef.current?.focus();
            yearRef.current?.select();
        }
        validateAndEmit(day, val, year);
    };

    const handleYearInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
        setYear(val);
        validateAndEmit(day, month, val);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'day' | 'month' | 'year') => {
        if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
            if (field === 'month') dayRef.current?.focus();
            if (field === 'year') monthRef.current?.focus();
        }
        if (e.key === 'ArrowRight' && (e.target as HTMLInputElement).selectionStart === (e.target as HTMLInputElement).value.length) {
            if (field === 'day') monthRef.current?.focus();
            if (field === 'month') yearRef.current?.focus();
        }
        if (e.key === 'ArrowLeft' && (e.target as HTMLInputElement).selectionStart === 0) {
            if (field === 'year') monthRef.current?.focus();
            if (field === 'month') dayRef.current?.focus();
        }
    };

    const setQuickDate = (type: 'today' | 'tomorrow' | 'nextWeek') => {
        const d = new Date();
        if (type === 'tomorrow') d.setDate(d.getDate() + 1);
        if (type === 'nextWeek') d.setDate(d.getDate() + 7);
        onChange(d.toISOString().split('T')[0] ?? '');
    };

    /** Handle selection from the Calendar component */
    const handleCalendarSelect = (selected: Date | undefined) => {
        if (selected) {
            const iso = selected.toISOString().split('T')[0] ?? '';
            onChange(iso);
            setCalendarOpen(false);
        }
    };

    /** Parse value to Date for Calendar's `selected` prop */
    const selectedDate = value ? new Date(value + 'T00:00:00') : undefined;

    return (
        <div data-slot="date-picker" className={cn("space-y-2", className)}>
            {/* Input Group */}
            <div
                className={cn(
                    "flex items-center bg-input border-2 border-border rounded-xl overflow-hidden transition-all",
                    "hover:border-indigo-300 dark:hover:border-indigo-700",
                    "focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10",
                    "cursor-text"
                )}
                onClick={() => dayRef.current?.focus()}
            >
                {/* Calendar Toggle via Radix Popover */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="w-12 h-12 flex items-center justify-center bg-primary/10 border-r border-border text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Abrir calendario"
                        >
                            <CalendarIcon className="h-5 w-5" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleCalendarSelect}
                            defaultMonth={selectedDate}
                            locale={undefined}
                        />
                    </PopoverContent>
                </Popover>

                {/* Segmented Inputs */}
                <div className="flex-1 flex items-center justify-center px-2 font-mono text-lg">
                    <input
                        ref={dayRef}
                        type="text"
                        inputMode="numeric"
                        className={SEGMENT_INPUT_CLASSES}
                        placeholder="DD"
                        value={day}
                        onChange={handleDayInput}
                        onKeyDown={(e) => handleKeyDown(e, 'day')}
                        maxLength={2}
                        aria-label="Día"
                    />
                    <span className="text-muted-foreground/40 text-xl font-light mx-1">/</span>
                    <input
                        ref={monthRef}
                        type="text"
                        inputMode="numeric"
                        className={SEGMENT_INPUT_CLASSES}
                        placeholder="MM"
                        value={month}
                        onChange={handleMonthInput}
                        onKeyDown={(e) => handleKeyDown(e, 'month')}
                        maxLength={2}
                        aria-label="Mes"
                    />
                    <span className="text-muted-foreground/40 text-xl font-light mx-1">/</span>
                    <input
                        ref={yearRef}
                        type="text"
                        inputMode="numeric"
                        className="w-12 bg-transparent border-none text-center outline-none placeholder:text-muted-foreground/50 selection:bg-indigo-100 selection:text-indigo-900 focus:ring-0"
                        placeholder="AAAA"
                        value={year}
                        onChange={handleYearInput}
                        onKeyDown={(e) => handleKeyDown(e, 'year')}
                        maxLength={4}
                        aria-label="Año"
                    />
                </div>
            </div>

            {/* Quick Actions — using platform Button */}
            <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="xs" type="button" onClick={() => setQuickDate('today')}>
                    Hoy
                </Button>
                <Button variant="ghost" size="xs" type="button" onClick={() => setQuickDate('tomorrow')}>
                    Mañana
                </Button>
                <Button variant="ghost" size="xs" type="button" onClick={() => setQuickDate('nextWeek')}>
                    Próx. Semana
                </Button>
            </div>
        </div>
    );
}

// ==========================================
// SMART TIME PICKER
// ==========================================
interface SmartTimePickerProps {
    value: string; // "HH:MM"
    onChange: (value: string) => void;
    className?: string;
}

export function SmartTimePicker({ value, onChange, className }: SmartTimePickerProps) {
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');

    const hourRef = useRef<HTMLInputElement>(null);
    const minuteRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHour(h || '');
            setMinute(m || '');
        } else {
            setHour('');
            setMinute('');
        }
    }, [value]);

    const validateAndEmit = (h: string, m: string) => {
        if (h.length === 2 && m.length === 2) {
            const hInt = parseInt(h);
            const mInt = parseInt(m);
            if (hInt >= 0 && hInt <= 23 && mInt >= 0 && mInt <= 59) {
                onChange(`${h}:${m}`);
            }
        }
    };

    const handleHour = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (parseInt(val) > 23) val = '23';
        setHour(val);
        if (val.length === 2) {
            minuteRef.current?.focus();
            minuteRef.current?.select();
        }
        validateAndEmit(val, minute);
    };

    const handleMinute = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (parseInt(val) > 59) val = '59';
        setMinute(val);
        validateAndEmit(hour, val);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'hour' | 'minute') => {
        if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
            if (field === 'minute') hourRef.current?.focus();
        }
        if (e.key === 'ArrowRight' && (e.target as HTMLInputElement).selectionStart === (e.target as HTMLInputElement).value.length) {
            if (field === 'hour') minuteRef.current?.focus();
        }
        if (e.key === 'ArrowLeft' && (e.target as HTMLInputElement).selectionStart === 0) {
            if (field === 'minute') hourRef.current?.focus();
        }
    };

    return (
        <div data-slot="time-picker" className={cn("space-y-2", className)}>
            <div
                className={cn(
                    "flex items-center bg-input border-2 border-border rounded-xl overflow-hidden transition-all",
                    "hover:border-indigo-300 dark:hover:border-indigo-700",
                    "focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10",
                    "cursor-text group"
                )}
                onClick={() => hourRef.current?.focus()}
            >
                <div className="w-12 h-12 flex items-center justify-center bg-accent/10 border-r border-border text-accent">
                    <Clock className="h-5 w-5" />
                </div>

                <div className="flex-1 flex items-center justify-center px-2 font-mono text-lg relative">
                    <input
                        ref={hourRef}
                        type="text"
                        inputMode="numeric"
                        className={SEGMENT_INPUT_CLASSES}
                        placeholder="HH"
                        value={hour}
                        onChange={handleHour}
                        onKeyDown={(e) => handleKeyDown(e, 'hour')}
                        maxLength={2}
                        aria-label="Hora"
                    />
                    <span className="text-accent animate-pulse font-bold mx-1">:</span>
                    <input
                        ref={minuteRef}
                        type="text"
                        inputMode="numeric"
                        className={SEGMENT_INPUT_CLASSES}
                        placeholder="MM"
                        value={minute}
                        onChange={handleMinute}
                        onKeyDown={(e) => handleKeyDown(e, 'minute')}
                        maxLength={2}
                        aria-label="Minutos"
                    />

                    <div className="absolute right-3 text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                        24H
                    </div>
                </div>
            </div>

            {/* Quick Actions — using platform Button */}
            <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="xs" type="button" onClick={() => onChange('09:00')}>
                    09:00
                </Button>
                <Button variant="ghost" size="xs" type="button" onClick={() => onChange('13:00')}>
                    13:00
                </Button>
                <Button variant="ghost" size="xs" type="button" onClick={() => onChange('19:00')}>
                    19:00
                </Button>
            </div>
        </div>
    );
}
