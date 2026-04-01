'use client';

/**
 * EventFeedback — Star-rating dialog for completed events.
 *
 * Shows 4 rating dimensions + comment. Only available for completed events.
 */

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, ThumbsUp, Send } from 'lucide-react';
import { submitFeedbackAction } from '@/actions/submit-feedback';

// ─── Types ──────────────────────────────────────────────────────────────────

interface EventFeedbackProps {
    quotationId: string;
    serviceName: string;
}

// ─── StarRating Sub-Component ───────────────────────────────────────────────

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className="p-0.5 transition-transform hover:scale-110"
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => onChange(star)}
                    >
                        <Star
                            className={`h-5 w-5 transition-colors ${star <= (hovered || value)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground/30'
                                }`}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function EventFeedback({ quotationId, serviceName }: EventFeedbackProps) {
    const [open, setOpen] = useState(false);
    const [overall, setOverall] = useState(0);
    const [quality, setQuality] = useState(0);
    const [punctuality, setPunctuality] = useState(0);
    const [communication, setCommunication] = useState(0);
    const [comment, setComment] = useState('');
    const [wouldRecommend, setWouldRecommend] = useState(true);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (overall === 0) {
            setError('Selecciona una calificación general');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const result = await submitFeedbackAction({
                quotationId,
                overallRating: overall,
                qualityRating: quality || undefined,
                punctualityRating: punctuality || undefined,
                communicationRating: communication || undefined,
                comment: comment || undefined,
                wouldRecommend,
            });

            if (!result.success) {
                setError(result.error ?? 'Error desconocido');
                return;
            }

            setSubmitted(true);
        } catch {
            setError('Error al enviar tu evaluación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/40"
                >
                    <Star className="h-3.5 w-3.5" />
                    Evaluar
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                {submitted ? (
                    <div className="text-center py-8">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-4">
                            <ThumbsUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">¡Gracias por tu evaluación!</h3>
                        <p className="text-sm text-muted-foreground">Tu feedback nos ayuda a mejorar continuamente.</p>
                        <Button className="mt-6" onClick={() => setOpen(false)}>Cerrar</Button>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-amber-500" />
                                Evaluar Evento
                            </DialogTitle>
                            <DialogDescription>{serviceName}</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <StarRating label="Experiencia General" value={overall} onChange={setOverall} />
                            <StarRating label="Calidad del Servicio" value={quality} onChange={setQuality} />
                            <StarRating label="Puntualidad" value={punctuality} onChange={setPunctuality} />
                            <StarRating label="Comunicación" value={communication} onChange={setCommunication} />

                            <div>
                                <label className="text-sm text-muted-foreground mb-1.5 block">Comentarios (opcional)</label>
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Cuéntanos tu experiencia..."
                                    rows={3}
                                    maxLength={500}
                                    className="resize-none"
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={wouldRecommend}
                                    onChange={(e) => setWouldRecommend(e.target.checked)}
                                    className="h-4 w-4 rounded border-muted-foreground/30 text-indigo-600"
                                />
                                <span className="text-sm text-foreground">Recomendaría este servicio</span>
                            </label>
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-200">{error}</div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={overall === 0 || loading}
                                className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                            >
                                {loading ? 'Enviando...' : (
                                    <>
                                        Enviar Evaluación
                                        <Send className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
