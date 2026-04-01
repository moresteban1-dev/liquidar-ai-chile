'use client';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';

interface PaymentContextType {
    initiatePayment: (entityId: string, type?: 'QUOTATION' | 'ORDER', paymentMethod?: 'WEBPAY' | 'TRANSFER') => Promise<void>;
    isProcessing: boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: ReactNode }) {
    const [isProcessing, setIsProcessing] = useState(false);

    const initiatePayment = async (entityId: string, type: 'QUOTATION' | 'ORDER' = 'QUOTATION', paymentMethod: 'WEBPAY' | 'TRANSFER' = 'WEBPAY') => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/payment/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ entityId, type, paymentMethod }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al iniciar el pago');
            }

            const { url } = await response.json();

            if (!url && paymentMethod !== 'TRANSFER') throw new Error('No se recibió URL de pago');

            if (paymentMethod === 'TRANSFER') {
                toast.success('Orden creada. Redirigiendo a instrucciones...');
                // Redirect based on type
                const redirectUrl = type === 'ORDER'
                    ? `/client/orders/${entityId}?payment=pending`
                    : `/client/quotations/${entityId}?payment=pending`;

                window.location.href = redirectUrl;
            } else {
                toast.loading('Redirigiendo a pasarela de pago...');
                window.location.href = url;
            }
        } catch (error: unknown) {
            logger.error('Payment Error:', error);
            const message = error instanceof Error ? error.message : 'Error al procesar el pago';
            toast.error(message);
            setIsProcessing(false);
        }
    };

    return (
        <PaymentContext.Provider value={{ initiatePayment, isProcessing }}>
            {children}
        </PaymentContext.Provider>
    );
}

export function usePayment() {
    const context = useContext(PaymentContext);
    if (!context) {
        throw new Error('usePayment must be used within a PaymentProvider');
    }
    return context;
}
