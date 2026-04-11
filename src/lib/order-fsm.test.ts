import { describe, it, expect } from 'vitest';
import { transitionOrder } from './order-fsm';
import { Order } from '@/types/order';

describe('Order FSM (Hardened)', () => {

    it('should allow valid flow: DRAFT -> PENDIENTE_PAGO -> PAGADA -> ASIGNADA', () => {
        const order: Order = {
            id: '1',
            clientId: 'client1',
            state: 'DRAFT',
            createdAt: new Date()
        } as any;

        const res1 = transitionOrder(order, { type: 'SUBMIT', briefId: 'b1' });
        expect(res1.isSuccess()).toBe(true);
        expect(res1.getValue()).toBe('PENDING_PAYMENT');

        const orderPaid: Order = { ...order, state: 'PENDING_PAYMENT', amount: 100 } as any;
        const res2 = transitionOrder(orderPaid, { type: 'PAYMENT_CAPTURED', paymentIntentId: 'pi_123' });
        expect(res2.isSuccess()).toBe(true);
        expect(res2.getValue()).toBe('PAID');
    });

    it('should BLOCK transition to ENTREGADA (Completed) without signature', () => {
        const order: Order = {
            id: '1',
            clientId: 'c1',
            state: 'UNDER_REVIEW',
            vendorId: 'v1',
            amount: 100,
            paymentIntentId: 'pi_1',
            payment_status: 'PAID',
            deliverableUrl: 'http://file.com',
            submittedAt: new Date()
        } as any;

        // Attempt without signature
        const res = transitionOrder(order, { type: 'CLIENT_APPROVED', signature: '' });
        expect(res.isFailure()).toBe(true);
        expect(res.getError().message).toContain("signature required");
    });

    it('should BLOCK transition to PAGADA without PaymentIntent', () => {
        const order: Order = {
            id: '1',
            clientId: 'client1',
            state: 'PENDING_PAYMENT',
            amount: 100,
            createdAt: new Date()
        } as any;

        const res = transitionOrder(order, { type: 'PAYMENT_CAPTURED', paymentIntentId: '' });
        expect(res.isFailure()).toBe(true);
        expect(res.getError().message).toContain("PaymentIntentID");
    });

    it('should NOT allow opening dispute on terminal state', () => {
        const order: Order = {
            id: '1',
            state: 'COMPLETED',
            clientId: 'c1',
            vendorId: 'v1',
            amount: 100,
            paymentIntentId: 'pi_1',
            deliverableUrl: 'http://url',
            clientSignature: 'sig',
            completedAt: new Date(),
            vendorPaidAt: new Date(),
            payment_status: 'PAID'
        } as any;

        const res = transitionOrder(order, { type: 'DISPUTE_OPENED', reason: 'Too late' });
        expect(res.isFailure()).toBe(true);
        expect(res.getError().message).toContain("Invalid transition");
    });

});
