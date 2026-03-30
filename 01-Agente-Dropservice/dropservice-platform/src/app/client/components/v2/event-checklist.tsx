'use client';

/**
 * EventChecklist — Interactive pre-event checklist.
 *
 * Persisted in localStorage per quotation. Shows completeness progress.
 */

import { useEventChecklist } from './use-event-checklist';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface EventChecklistProps {
    quotationId: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function EventChecklist({ quotationId }: EventChecklistProps) {
    const { items, toggle, completed, total, percentage } = useEventChecklist(quotationId);

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-semibold text-foreground">Checklist Pre-Evento</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-mono tabular-nums text-muted-foreground">
                        {completed}/{total}
                    </span>
                    <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                {items.map((item) => (
                    <button
                        key={item.id}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors text-left"
                        onClick={() => toggle(item.id)}
                    >
                        {item.checked ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                        )}
                        <span className={`text-sm ${item.checked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>

            {percentage === 100 && (
                <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        ✅ ¡Todo listo para tu evento!
                    </p>
                </div>
            )}
        </div>
    );
}
