'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { Quotation } from '@/lib/types';
import { GatewaySlug } from '@/types/payments';
import { approveQuote } from '@/actions/quotations';

interface ClientLineItem {
    id: string;
    description: string;
    quantity: number;
    unit_price_net: number;
    total_price_net: number;
}

export function useQuotationDetails(id: string) {
    const [quotation, setQuotation] = useState<Quotation | null>(null);
    const [clientItems, setClientItems] = useState<ClientLineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedGateway, setSelectedGateway] = useState<GatewaySlug | null>(null);
    const [paymentResponse, setPaymentResponse] = useState<Record<string, unknown> | null>(null);
    const [paymentCreating, setPaymentCreating] = useState(false);

    const fetchQuotation = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/client/quotations/${id}?_t=${Date.now()}`);
            if (res.status === 404) {
                setError('Cotización no encontrada');
                return;
            }
            if (res.status === 403) {
                setError('No tienes permiso para ver esta cotización');
                return;
            }
            if (!res.ok) throw new Error('Error al cargar detalle');

            const data = await res.json();
            setQuotation(data);

            const hasPrice = data.publicStatus === 'COTIZADA' || data.publicStatus === 'APPROVED' || data.status === 'AWAITING_CLIENT_PAYMENT';
            if (hasPrice) {
                try {
                    const itemsRes = await fetch(`/api/quotations/${id}/client-items`);
                    if (itemsRes.ok) {
                        const items = await itemsRes.json();
                        setClientItems(items);
                    }
                } catch { /* Items optional */ }
            }
        } catch (err) {
            logger.error('Error loading quotation detail', err as Error);
            setError('Error al cargar la información');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchQuotation();
    }, [id, fetchQuotation]);

    const handlePay = async () => {
        if (!selectedGateway) return;

        if (quotation?.publicStatus === 'COTIZADA') {
            if (!confirm('¿Confirmas que deseas aprobar el presupuesto y proceder al pago?')) return;
        }

        setPaymentCreating(true);

        try {
            let orderIdToPay = quotation?.orders?.[0]?.id;

            if (quotation?.publicStatus === 'COTIZADA' && quotation.status !== 'AWAITING_CLIENT_PAYMENT') {
                const result = await approveQuote(id);
                if (!result.success) {
                    alert('Error al aprobar: ' + result.error);
                    setPaymentCreating(false);
                    return;
                }
                if (result.data) {
                    orderIdToPay = result.data;
                }
            }

            if (!orderIdToPay) {
                orderIdToPay = quotation?.id;
            }

            const res = await fetch('/api/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: orderIdToPay,
                    gateway_slug: selectedGateway,
                    amount: quotation?.priceTotal
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error creando pago');
            }

            const paymentData = await res.json();

            if (paymentData.redirect_url) {
                window.location.href = paymentData.redirect_url;
            } else if (paymentData.bank_data) {
                setPaymentResponse(paymentData);
            }

        } catch (error) {
            logger.error('Error in payment flow', error as Error);
            alert((error as Error).message);
        } finally {
            setPaymentCreating(false);
        }
    };

    return {
        quotation,
        clientItems,
        loading,
        error,
        selectedGateway,
        setSelectedGateway,
        paymentResponse,
        paymentCreating,
        handlePay
    };
}
