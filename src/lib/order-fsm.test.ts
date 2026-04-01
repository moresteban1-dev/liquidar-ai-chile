/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { transitionOrder } from './order-fsm';
import { Order } from '@/types/order';

describe('Order FSM (Hardened)', () => {

    it('should allow valid flow: DRAFT -> PENDIENTE_PAGO -> PAGADA -> ASIGNADA', () => {
        const order: Order = {
            id: '1',
            clientId: 'client1',
            state: 'DRAFT',
            briefId: null,
            createdAt: new Date()
        } as any;

        const s1 = transitionOrder(order, { type: 'SUBMIT', briefId: 'b1' });
        expect(s1).toBe('PENDING_PAYMENT');

        const orderPaid: Order = { ...order, state: 'PENDING_PAYMENT', briefId: 'b1', amount: 100 } as any;
        const s2 = transitionOrder(orderPaid, { type: 'PAYMENT_CAPTURED', paymentIntentId: 'pi_123' });
        expect(s2).toBe('PAID');
    });

    it('should BLOCK transition to ENTREGADA (Completed) without signature', () => {
        const order: Order = {
            id: '1',
            clientId: 'c1',
            state: 'UNDER_REVIEW',
            briefId: 'b1',
            vendorId: 'v1',
            amount: 100,
            paymentIntentId: 'pi_1',
            payment_status: 'PAID',
            deliverableUrl: 'http://file.com',
            submittedAt: new Date()
        } as any; // Cast to avoid full mock for brevity

        // Attempt without signature
        expect(() => {
            transitionOrder(order, { type: 'CLIENT_APPROVED', signature: '' });
        }).toThrow("digital signature required");
    });

    it('should BLOCK transition to PAGADA without PaymentIntent', () => {
        const order: Order = {
            id: '1',
            clientId: 'client1',
            state: 'PENDING_PAYMENT',
            briefId: 'b1',
            amount: 100,
            createdAt: new Date()
        } as any;

        expect(() => {
            transitionOrder(order, { type: 'PAYMENT_CAPTURED', paymentIntentId: '' });
        }).toThrow("PaymentIntentID");
    });

    it('should NOT allow opening dispute on terminal state', () => {
        const order: Order = {
            id: '1',
            state: 'COMPLETED',
            clientId: 'c1',
            vendorId: 'v1',
            briefId: 'b1',
            amount: 100,
            paymentIntentId: 'pi_1',
            deliverableUrl: 'http://url',
            clientSignature: 'sig',
            completedAt: new Date(),
            vendorPaidAt: new Date(),
            payment_status: 'PAID'
        };

        expect(() => {
            transitionOrder(order, { type: 'DISPUTE_OPENED', reason: 'Too late' });
        }).toThrow("Invalid transition");
    });

});
