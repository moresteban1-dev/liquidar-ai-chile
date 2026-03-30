'use client';

/**
 * QuotationComparator — Side-by-side comparison of quotations.
 *
 * Client selects 2-3 quotations from a list, then sees a comparison table
 * showing service, date, attendees, amount, status, and location.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Columns, Check, X } from 'lucide-react';
import { formatCLP } from '@/lib/formatters';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ComparableQuotation {
    id: string;
    code: string;
    serviceName: string;
    eventDate: string;
    attendees: number;
    amount: number;
    status: string;
    publicStatus: string;
    createdAt: string;
    eventLocation: string;
}

interface QuotationComparatorProps {
    quotations: ComparableQuotation[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export function QuotationComparator({ quotations }: QuotationComparatorProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else if (next.size < 3) {
                next.add(id);
            }
            return next;
        });
    };

    const selected = quotations.filter(q => selectedIds.has(q.id));

    const rows: { label: string; getValue: (q: ComparableQuotation) => string }[] = [
        { label: 'Servicio', getValue: q => q.serviceName },
        { label: 'Fecha Evento', getValue: q => q.eventDate ? new Date(q.eventDate).toLocaleDateString('es-CL') : 'N/A' },
        { label: 'Ubicación', getValue: q => q.eventLocation },
        { label: 'Asistentes', getValue: q => String(q.attendees) },
        { label: 'Monto', getValue: q => q.amount > 0 ? formatCLP(q.amount) : 'Pendiente' },
        { label: 'Estado', getValue: q => q.publicStatus },
        { label: 'Solicitada', getValue: q => new Date(q.createdAt).toLocaleDateString('es-CL') },
    ];

    return (
        <div className="space-y-6">
            {/* Selection List */}
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Columns className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-lg font-semibold text-foreground">Comparar Cotizaciones</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {selectedIds.size}/3 seleccionadas
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {quotations.map(q => {
                        const isSelected = selectedIds.has(q.id);
                        return (
                            <button
                                key={q.id}
                                onClick={() => toggleSelection(q.id)}
                                className={`p-3 rounded-lg border text-left transition-all ${isSelected
                                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-300'
                                        : 'border-border/50 hover:border-indigo-200 hover:bg-muted/10'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs text-muted-foreground">{q.code}</span>
                                    {isSelected ? (
                                        <Check className="h-4 w-4 text-indigo-600" />
                                    ) : (
                                        <div className="h-4 w-4 rounded border border-muted-foreground/30" />
                                    )}
                                </div>
                                <p className="text-sm font-medium mt-1 truncate">{q.serviceName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="neutral" className="text-[10px]">{q.publicStatus}</Badge>
                                    {q.amount > 0 && (
                                        <span className="text-xs font-mono">{formatCLP(q.amount)}</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Comparison Table */}
            {selected.length >= 2 && (
                <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm overflow-x-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Comparación</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs gap-1"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            <X className="h-3.5 w-3.5" />
                            Limpiar
                        </Button>
                    </div>

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-2 pr-4 text-muted-foreground font-medium w-32" />
                                {selected.map(q => (
                                    <th key={q.id} className="text-center py-2 px-3 font-medium text-foreground">
                                        <span className="font-mono text-xs text-muted-foreground block">{q.code}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.label} className="border-b border-border/50">
                                    <td className="py-2.5 pr-4 text-muted-foreground font-medium text-xs">{row.label}</td>
                                    {selected.map(q => (
                                        <td key={q.id} className="py-2.5 px-3 text-center text-foreground">
                                            {row.getValue(q)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selected.length < 2 && selectedIds.size > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                    Selecciona al menos 2 cotizaciones para comparar
                </p>
            )}
        </div>
    );
}
