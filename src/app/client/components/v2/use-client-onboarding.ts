'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'client-onboarding-completed';

export function useClientOnboarding() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        try {
            const completed = localStorage.getItem(STORAGE_KEY);
            if (!completed) {
                const timer = setTimeout(() => setOpen(true), 800);
                return () => clearTimeout(timer);
            }
        } catch { /* localStorage not available */ }
        return undefined;
    }, []);

    const complete = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch { /* localStorage not available */ }
        setOpen(false);
    }, []);

    const next = useCallback((totalSteps: number) => {
        setStep(current => {
            if (current < totalSteps - 1) return current + 1;
            complete();
            return current;
        });
    }, [complete]);

    const prev = useCallback(() => {
        setStep(current => (current > 0 ? current - 1 : current));
    }, []);

    return {
        open,
        setOpen,
        step,
        next,
        prev,
        complete
    };
}
