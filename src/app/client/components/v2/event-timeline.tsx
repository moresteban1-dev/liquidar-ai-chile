'use client';

/**
 * EventTimeline — Visual step-by-step progress of a quotation.
 *
 * Maps internal statuses to user-friendly steps with ETAs,
 * animated current step, and green-completed markers.
 */

import { cn } from '@/lib/utils';
import { Check, Circle, Clock, Loader2 } from 'lucide-react';

// ─── Timeline Steps Configuration ───────────────────────────────────────────

interface TimelineStepConfig {
    key: string;
    label: string;
    description: string;
    icon: string;
    estimatedTime?: string;
}

const TIMELINE_STEPS: TimelineStepConfig[] = [
    {
        key: 'PENDING_ASSIGNMENT',
        label: 'Solicitud Recibida',
        description: 'Tu solicitud de cotización fue registrada exitosamente',
        icon: '📥',
        estimatedTime: 'Instantáneo',
    },
    {
        key: 'PENDING_PROVIDER_BID',
        label: 'En Proceso',
        description: 'Estamos trabajando en tu cotización y seleccionando a los mejores profesionales',
        icon: '🔍',
        estimatedTime: '24-48 horas',
    },
    {
        key: 'PENDING_ADMIN_APPROVAL',
        label: 'Preparando Cotización',
        description: 'Revisamos las propuestas y preparamos tu cotización personalizada',
        icon: '📋',
        estimatedTime: '12-24 horas',
    },
    {
        key: 'AWAITING_CLIENT_PAYMENT',
        label: 'Cotización Lista',
        description: 'Tu cotización está lista para revisión y aprobación',
        icon: '✅',
        estimatedTime: 'Esperando tu confirmación',
    },
    {
        key: 'APPROVED',
        label: 'Evento Confirmado',
        description: 'Tu evento está confirmado. Nuestro equipo se está preparando',
        icon: '🎉',
    },
    {
        key: 'COMPLETED',
        label: 'Evento Completado',
        description: '¡Evento realizado! Cuéntanos tu experiencia',
        icon: '🏁',
    },
];

// Map alternate statuses to their canonical timeline position
const STATUS_ALIASES: Record<string, string> = {
    DRAFT: 'PENDING_ASSIGNMENT',
    PAID: 'APPROVED',
    FULFILLED: 'COMPLETED',
};

// ─── Component ──────────────────────────────────────────────────────────────

interface EventTimelineProps {
    /** Internal quotation status */
    currentStatus: string;
    /** ISO string of quotation creation date */
    createdAt: string;
}

export function EventTimeline({ currentStatus, createdAt }: EventTimelineProps) {
    const normalizedStatus = STATUS_ALIASES[currentStatus] ?? currentStatus;
    const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.key === normalizedStatus);

    // Don't render if status is unrecognized
    if (currentStepIndex === -1) return null;

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-5 border-b border-border pb-2">
                📍 Estado de tu Solicitud
            </h2>

            <div className="space-y-0">
                {TIMELINE_STEPS.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const isFuture = index > currentStepIndex;

                    return (
                        <div key={step.key} className="flex gap-4">
                            {/* Vertical line + Icon */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        'w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border-2 transition-all',
                                        isCompleted && 'bg-green-100 border-green-500 dark:bg-green-900/30',
                                        isCurrent && 'bg-indigo-100 border-indigo-500 dark:bg-indigo-900/30 ring-4 ring-indigo-100 dark:ring-indigo-900/20',
                                        isFuture && 'bg-muted border-muted-foreground/20',
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5 text-green-600" />
                                    ) : isCurrent ? (
                                        <span className="text-base">{step.icon}</span>
                                    ) : (
                                        <Circle className="w-4 h-4 text-muted-foreground/30" />
                                    )}
                                </div>

                                {/* Connecting line */}
                                {index < TIMELINE_STEPS.length - 1 && (
                                    <div
                                        className={cn(
                                            'w-0.5 flex-1 min-h-[40px]',
                                            isCompleted ? 'bg-green-300 dark:bg-green-700' : 'bg-muted-foreground/10',
                                        )}
                                    />
                                )}
                            </div>

                            {/* Content */}
                            <div className={cn('pb-6 flex-1', isFuture && 'opacity-40')}>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4
                                        className={cn(
                                            'font-medium text-sm',
                                            isCurrent && 'text-indigo-700 dark:text-indigo-400',
                                            isCompleted && 'text-green-700 dark:text-green-400',
                                        )}
                                    >
                                        {step.label}
                                    </h4>
                                    {isCurrent && (
                                        <span className="flex items-center gap-1 text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            En curso
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {step.description}
                                </p>

                                {/* Timestamp or ETA */}
                                <div className="mt-1.5">
                                    {index === 0 && createdAt ? (
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(createdAt).toLocaleDateString('es-CL', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    ) : isCurrent && step.estimatedTime ? (
                                        <span className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Tiempo estimado: {step.estimatedTime}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
