'use client';

/**
 * RequoteButton — Dialog to re-quote a completed event.
 *
 * Shows original event summary, date picker, and attendees input.
 * On submit, calls the requote server action and redirects to the new quotation.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Calendar, Users, ArrowRight } from 'lucide-react';
import { createRequoteAction } from '@/actions/requote';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RequoteButtonProps {
    quotation: {
        id: string;
        code: string;
        serviceName: string;
        eventDate: string;
        attendees?: number;
    };
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RequoteButton({ quotation }: RequoteButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newAttendees, setNewAttendees] = useState<number>(quotation.attendees ?? 50);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        setLoading(true);

        try {
            const result = await createRequoteAction({
                originalQuotationId: quotation.id,
                newEventDate: newDate,
                newAttendees: newAttendees,
            });

            if (!result.success) {
                setError(result.error ?? 'Error desconocido');
                return;
            }

            setOpen(false);
            router.push(`/client/quotations/${result.newQuotationId}`);
        } catch {
            setError('Error al procesar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    // Minimum date: tomorrow
    // eslint-disable-next-line react-hooks/purity
    const minDate = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-950/40"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Re-cotizar
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-indigo-600" />
                        Re-cotizar Evento
                    </DialogTitle>
                    <DialogDescription>
                        Crea una nueva solicitud basada en tu evento anterior.
                        Solo necesitas actualizar la fecha y asistentes.
                    </DialogDescription>
                </DialogHeader>

                {/* Original Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 border border-border">
                    <h4 className="text-sm font-medium text-foreground">Evento Original</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-muted-foreground text-xs">Servicio</span>
                            <p className="font-medium">{quotation.serviceName}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground text-xs">Código</span>
                            <p className="font-mono">{quotation.code}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground text-xs">Fecha Original</span>
                            <p>{quotation.eventDate
                                ? new Date(quotation.eventDate).toLocaleDateString('es-CL')
                                : 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* New Data Inputs */}
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            Nueva Fecha del Evento
                        </label>
                        <Input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            min={minDate}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            Número de Asistentes
                        </label>
                        <Input
                            type="number"
                            value={newAttendees}
                            onChange={(e) => setNewAttendees(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            min={1}
                            max={10000}
                            className="w-full"
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-200">
                        {error}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!newDate || loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                    >
                        {loading ? 'Creando...' : (
                            <>
                                Crear Nueva Solicitud
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
