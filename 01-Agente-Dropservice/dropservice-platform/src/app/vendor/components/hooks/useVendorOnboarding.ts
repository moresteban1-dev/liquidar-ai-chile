import { useState, useEffect, useCallback } from 'react';

export interface OnboardingStep {
    id: string;
    label: string;
    description: string;
    isComplete: boolean;
    href: string;
}

export interface UseVendorOnboardingResult {
    dismissed: boolean;
    progress: number;
    completedCount: number;
    steps: OnboardingStep[];
    handleDismiss: () => void;
}

/**
 * NASA-Grade Engineering: Custom Hook for Vendor Onboarding Logic
 * 
 * Separates the state and persistence logic from the UI component.
 */
export function useVendorOnboarding(
  hasProfile: boolean, 
  hasInventory: boolean, 
  hasBids: boolean
): UseVendorOnboardingResult {
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const isDismissed = localStorage.getItem('vendor-onboarding-dismissed');
        if (isDismissed === 'true') setDismissed(true);
    }, []);

    const handleDismiss = useCallback(() => {
        setDismissed(true);
        localStorage.setItem('vendor-onboarding-dismissed', 'true');
    }, []);

    const steps = [
        {
            id: 'profile',
            label: 'Completa tu Perfil',
            description: 'Agrega tu nombre, datos bancarios y zona de servicio',
            isComplete: hasProfile,
            href: '/vendor/settings',
        },
        {
            id: 'inventory',
            label: 'Agrega tu Inventario',
            description: 'Lista los servicios y equipos que ofreces',
            isComplete: hasInventory,
            href: '/vendor/inventory',
        },
        {
            id: 'bid',
            label: 'Envía tu Primera Cotización',
            description: 'Responde a una oportunidad y envía tu propuesta',
            isComplete: hasBids,
            href: '/vendor/quotations',
        },
    ];

    const completedCount = steps.filter(s => s.isComplete).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    return {
        dismissed,
        progress,
        completedCount,
        steps,
        handleDismiss
    };
}
