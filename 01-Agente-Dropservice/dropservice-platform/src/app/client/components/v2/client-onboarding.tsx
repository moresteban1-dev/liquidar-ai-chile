'use client';

/**
 * ClientOnboarding — Welcome stepper modal for first-time clients.
 *
 * Shows a 4-step guided tour of the dashboard features.
 * Persisted in localStorage so it only shows once.
 */

import { useClientOnboarding } from './use-client-onboarding';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    FileText,
    Bell,
    Calendar,
    ChevronRight,
    ChevronLeft,
    Rocket,
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────

const STEPS = [
    {
        icon: Sparkles as any,
        title: '¡Bienvenido a tu Dashboard!',
        description: 'Desde aquí podrás gestionar todos tus eventos, cotizaciones y pagos en un solo lugar.',
        color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400',
    },
    {
        icon: FileText as any,
        title: 'Cotiza en Segundos',
        description: 'Usa el botón "Nueva Solicitud" para crear cotizaciones. Recibe respuestas de proveedores verificados y compara propuestas lado a lado.',
        color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
        icon: Bell as any,
        title: 'Notificaciones en Tiempo Real',
        description: 'El ícono de campana te avisa cuando hay actualizaciones en tus cotizaciones, pagos confirmados o eventos próximos.',
        color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
    },
    {
        icon: Calendar as any,
        title: 'Todo Bajo Control',
        description: 'Revisa tu calendario de eventos, checklist pre-evento, historial de pagos y documentos. ¡Estás listo para comenzar!',
        color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    },
];

// ─── Component ──────────────────────────────────────────────────────────────

export function ClientOnboarding() {
    const { open, step, next, prev, complete } = useClientOnboarding();

    const currentStep = STEPS[step];
    if (!currentStep) return null;
    
    const isLast = step === STEPS.length - 1;
    const StepIcon = currentStep.icon;

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) complete(); }}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
                {/* Progress bar */}
                <div className="h-1 bg-muted">
                    <div
                        className="h-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                    />
                </div>

                <div className="p-8 text-center">
                    {/* Icon */}
                    <div className={`flex items-center justify-center h-16 w-16 rounded-2xl mx-auto mb-6 ${currentStep.color}`}>
                        <StepIcon className="h-8 w-8" />
                    </div>

                    {/* Content */}
                    <h2 className="text-xl font-bold text-foreground mb-3">{currentStep.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                        {currentStep.description}
                    </p>

                    {/* Step indicators */}
                    <div className="flex items-center justify-center gap-1.5 mt-6 mb-6">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-indigo-600' : 'w-2 bg-muted-foreground/20'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={step === 0 ? complete : prev}
                            className="text-muted-foreground"
                        >
                            {step === 0 ? (
                                'Omitir'
                            ) : (
                                <>
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Atrás
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={() => next(STEPS.length)}
                            className={`gap-1.5 ${isLast
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                        >
                            {isLast ? (
                                <>
                                    <Rocket className="h-4 w-4" />
                                    ¡Comenzar!
                                </>
                            ) : (
                                <>
                                    Siguiente
                                    <ChevronRight className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
