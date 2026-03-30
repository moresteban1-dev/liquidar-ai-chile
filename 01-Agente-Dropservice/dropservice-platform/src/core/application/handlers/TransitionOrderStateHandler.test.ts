import { describe, it, expect, beforeEach } from 'vitest';
import { TransitionOrderStateHandler } from './TransitionOrderStateHandler';
import { TransitionOrderStateCommand } from '../commands/TransitionOrderStateCommand';
import { InMemoryOrderRepository } from '../../../../tests/mocks/InMemoryOrderRepository';
import { InMemoryEventPublisher } from '../../../../tests/mocks/InMemoryEventPublisher';
import { Order } from '../../domain/aggregates/order/Order';
import { UniqueEntityID } from '../../shared/UniqueEntityID';
import { Money } from '../../domain/value-objects/Money';
import { QuotationPricing } from '../../domain/aggregates/order/QuotationPricing';

describe('TransitionOrderStateHandler', () => {
    let handler: TransitionOrderStateHandler;
    let orderRepository: InMemoryOrderRepository;
    let eventPublisher: InMemoryEventPublisher;

    beforeEach(() => {
        orderRepository = new InMemoryOrderRepository();
        eventPublisher = new InMemoryEventPublisher();
        handler = new TransitionOrderStateHandler(orderRepository, eventPublisher);
    });

    const createOrderInState = async (state: string): Promise<Order> => {
        const pricing = QuotationPricing.fromSimpleMarkup(
            Money.create(100, 'USD').unwrap(),
            20,
            19
        ).unwrap();

        const orderResult = Order.create({
            clientId: new UniqueEntityID('client-1'),
            state: state as any,
            pricing: pricing,
            eventDate: new Date(),
            deliveryAddress: 'Test Address',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const order = orderResult.unwrap();
        await orderRepository.save(order);
        return order;
    };

    describe('Success Cases', () => {
        it('should transition DRAFT to CONFIRMED', async () => {
            const order = await createOrderInState('DRAFT');
            const command: TransitionOrderStateCommand = {
                orderId: order.orderId.toString(),
                newState: 'CONFIRMED',
                performedBy: 'user-1',
                performedByRole: 'admin'
            };

            const result = await handler.handle(command);

            expect(result.isSuccess()).toBe(true);
            const updatedOrder = await orderRepository.findById(order.orderId);
            expect(updatedOrder.unwrap()?.state).toBe('CONFIRMED');
        });
    });

    describe('Failure Cases', () => {
        it('should fail if order does not exist', async () => {
            const command: TransitionOrderStateCommand = {
                orderId: 'non-existent',
                newState: 'CONFIRMED',
                performedBy: 'user-1',
                performedByRole: 'admin'
            };

            const result = await handler.handle(command);

            expect(result.isFailure()).toBe(true);
            expect(result.error.code).toBe('NOT_FOUND');
        });
    });
});
