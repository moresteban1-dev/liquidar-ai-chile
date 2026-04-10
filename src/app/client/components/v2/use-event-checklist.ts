'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface ChecklistItem {
    id: string;
    label: string;
    checked: boolean;
}

const DEFAULT_ITEMS = [
    { id: 'venue', label: 'Confirmar dirección y acceso al lugar' },
    { id: 'contact', label: 'Compartir datos de contacto del encargado' },
    { id: 'schedule', label: 'Confirmar horario de montaje y desmontaje' },
    { id: 'power', label: 'Verificar disponibilidad eléctrica' },
    { id: 'parking', label: 'Confirmar estacionamiento para equipo técnico' },
    { id: 'payment', label: 'Realizar pago pendiente' },
    { id: 'documents', label: 'Enviar permisos o documentos requeridos' },
    { id: 'layout', label: 'Definir layout / plano del espacio' },
];

export function useEventChecklist(quotationId: string) {
    const storageKey = useMemo(() => `event-checklist-${quotationId}`, [quotationId]);

    const [items, setItems] = useState<ChecklistItem[]>(() =>
        DEFAULT_ITEMS.map(item => ({ ...item, checked: false }))
    );

    // Initial load
    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored) as Record<string, boolean>;
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setItems(prev =>
                    prev.map(item => ({ ...item, checked: !!parsed[item.id] }))
                );
            }
        } catch { /* localStorage not available */ }
    }, [storageKey]);

    const persist = useCallback((updatedItems: ChecklistItem[]) => {
        try {
            const state: Record<string, boolean> = {};
            for (const item of updatedItems) {
                state[item.id] = item.checked;
            }
            localStorage.setItem(storageKey, JSON.stringify(state));
        } catch { /* localStorage not available */ }
    }, [storageKey]);

    const toggle = useCallback((id: string) => {
        setItems(prev => {
            const updated = prev.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            );
            persist(updated);
            return updated;
        });
    }, [persist]);

    const completed = useMemo(() => items.filter(i => i.checked).length, [items]);
    const total = items.length;
    const percentage = useMemo(() => Math.round((completed / total) * 100), [completed, total]);

    return {
        items,
        toggle,
        completed,
        total,
        percentage
    };
}
