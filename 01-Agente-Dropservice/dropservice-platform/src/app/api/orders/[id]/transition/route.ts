/**
 * Order Transition API - SUPABASE VERSION
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import {
    isValidTransition,
    getAvailableTransitions,
    getPublicStatus,
} from '@/lib/order-fsm';
import { OrderState } from '@/types/order';
import { withAuth } from '@/lib/api/with-auth';

// GET: Available transitions
export const GET = withAuth(async (_request, _user, params) => {
    try {
        const id = params?.id;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const supabase = await createApiClient();

        const { data: order, error } = await supabase
            .from('orders')
            .select('id, status, code')
            .eq('id', id)
            .single();

        if (error || !order) {
            return NextResponse.json(
                { success: false, error: 'Orden no encontrada' },
                { status: 404 }
            );
        }

        const availableTransitions = getAvailableTransitions(order.status as OrderState);

        return NextResponse.json({
            success: true,
            data: {
                currentStatus: order.status,
                publicStatus: getPublicStatus(order.status as OrderState),
                availableTransitions,
            },
        });
    } catch (error) {
        logger.error('Error getting transitions:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener transiciones' },
            { status: 500 }
        );
    }
});

// POST: Execute transition
export const POST = withAuth(async (request, _user, params) => {
    try {
        const id = params?.id;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const supabase = await createApiClient();
        const body = await request.json();
        const { toStatus, notes } = body;

        if (!toStatus) {
            return NextResponse.json(
                { success: false, error: 'Se requiere toStatus' },
                { status: 400 }
            );
        }

        // Get current order
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !order) {
            return NextResponse.json(
                { success: false, error: 'Orden no encontrada' },
                { status: 404 }
            );
        }

        // Validate transition
        if (!isValidTransition(order.status as OrderState, toStatus as OrderState)) {
            return NextResponse.json({
                success: false,
                error: `Transición inválida: ${order.status} → ${toStatus}`,
                availableTransitions: getAvailableTransitions(order.status as OrderState),
            }, { status: 400 });
        }

        // Execute transition
        const updateData: Record<string, unknown> = {
            status: toStatus,
        };

        if (toStatus === 'DELIVERED') {
            updateData.delivered_at = new Date().toISOString();
        }

        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                client:profiles!orders_client_id_fkey(name, email),
                quotation:quotations(brief)
            `)
            .single();

        if (updateError) {
            return NextResponse.json(
                { success: false, error: 'Error al transicionar orden' },
                { status: 500 }
            );
        }

        // Send Email Notification
        if (toStatus === 'DELIVERED' && updatedOrder.client?.email) {
            const { notifyOrderDelivered } = await import('@/lib/notifications');
            notifyOrderDelivered({
                clientEmail: updatedOrder.client.email,
                clientName: updatedOrder.client.name,
                orderCode: updatedOrder.code,
                brief: updatedOrder.quotation?.brief || 'Sin descripción',
            }).catch(err => logger.error('Email error:', err));
        }

        console.info(`Order ${order.code} transitioned: ${order.status} → ${toStatus}`, notes);

        // QA Sentinel AI Trigger
        if (toStatus === 'LISTA_ENTREGA' || toStatus === 'DELIVERED') {
            try {
                const { getQueue, QUEUE_NAMES } = await import('@infrastructure/queue/queue.factory');
                const qaQueue = getQueue(QUEUE_NAMES.QA_SENTINEL_JOBS);
                await qaQueue.add('qa-sentinel-analysis', {
                    orderId: id,
                    providerNotes: notes || 'Sin notas del proveedor',
                    deliverableType: 'TEXT' // MVP assumes TEXT initially
                });
                logger.info(`[order-transition] QA Sentinel Job enqueued for order: ${id}`);
            } catch (queueErr) {
                logger.error('[order-transition] Falló al encolar el QA Sentinel:', queueErr);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                ...updatedOrder,
                publicStatus: getPublicStatus(updatedOrder.status as OrderState),
            },
        });
    } catch (error) {
        logger.error('Error transitioning order:', error);
        return NextResponse.json(
            { success: false, error: 'Error al transicionar orden' },
            { status: 500 }
        );
    }
});
