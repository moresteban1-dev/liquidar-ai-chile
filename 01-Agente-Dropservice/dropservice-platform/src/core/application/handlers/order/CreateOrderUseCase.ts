import { Result, ok, fail } from '@core/shared/Result';
import { Order } from '@core/domain/aggregates/order/Order';
import { Money } from '@core/domain/value-objects/Money';
import { QuotationPricing } from '../../../domain/aggregates/order/QuotationPricing';
import { DomainError } from '@core/domain/errors/DomainError';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { IOrderRepository } from '@app/ports/IOrderRepository';
import { IEventPublisher } from '@core/application/ports/events/IEventPublisher';
import { ICommand } from '@core/shared/ICommand';
import { ICommandHandler } from '@core/shared/ICommandHandler';
import { AppError } from '@core/shared/AppError';

/**
 * Command to create a new order directly (bypassing quotation if needed).
 */
export class CreateOrderCommand implements ICommand {
    readonly commandName = 'CreateOrderCommand';
    constructor(
        public readonly clientId: string,
        public readonly serviceId: string,
        public readonly requirements: string,
        public readonly deadlineDays: number,
        public readonly priceAmount: number
    ) { }
}

/**
 * Handler for CreateOrderCommand.
 * Orchestrates pure aggregate creation and its subsequent persistence.
 */
/**
 * Simple DTO for test/API consumers that don't construct full CreateOrderCommand.
 */
export interface CreateOrderDTO {
    clientId: string;
    eventDate: string;
    deliveryAddress: string;
    eventType?: string;
    estimatedGuests?: number;
    specialInstructions?: string;
}

export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand, Order> {
    constructor(
        private readonly orderRepository: IOrderRepository,
        private readonly eventPublisher: IEventPublisher,
    ) { }

    /**
     * Public entry point: accepts either a CreateOrderCommand or a simple DTO.
     * Bridges the interface gap where consumers call `.execute()` with a plain object.
     */
    async execute(input: CreateOrderDTO | CreateOrderCommand): Promise<Result<Order, AppError>> {
        if (input instanceof CreateOrderCommand) {
            return this.handle(input);
        }

        // Build a lightweight Order directly from the DTO (API/test path)
        return this.handleFromDTO(input);
    }

    async handle(command: CreateOrderCommand): Promise<Result<Order, AppError>> {
        try {
            // 1. Create Domain Entity (Pure Logic)
            const priceResult = Money.create(command.priceAmount, 'USD');
            if (priceResult.isFailure()) {
                return fail(AppError.businessRule(`Invalid Price: ${priceResult.error}`));
            }

            // Calculate pricing - Using the provider cost as base
            const pricingResult = QuotationPricing.fromSimpleMarkup(priceResult.unwrap(), 20, 19);
            if (pricingResult.isFailure()) {
                return fail(AppError.businessRule(pricingResult.error));
            }

            const orderResult = Order.create({
                clientId: new UniqueEntityID(command.clientId),
                state: 'DRAFT',
                pricing: pricingResult.unwrap(),
                eventDate: new Date(), // Default for manual creation
                deliveryAddress: 'See instructions',
                specialInstructions: command.requirements,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            if (orderResult.isFailure()) {
                return fail(AppError.businessRule(orderResult.error));
            }
            const order = orderResult.unwrap();

            // 2. Persist (Side Effect)
            const savedResult = await this.orderRepository.save(order);
            if (savedResult.isFailure()) {
                return fail(AppError.from(new Error(savedResult.error)));
            }

            // 3. Publish Events (Side Effect)
            const events = order.pullDomainEvents();
            if (events.length > 0) {
              const publishResult = await this.eventPublisher.publishMany(events);
              if (publishResult.isFailure()) {
                  // We log but don't fail the whole use case as persistence was successful
                  console.warn('Events published with partial failures:', publishResult.error);
              }
            }

            return ok(order);

        } catch (error) {
            if (error instanceof DomainError) {
                return fail(AppError.businessRule(error.message));
            }
            return fail(AppError.from(error));
        }
    }

    /**
     * Handles creation from a lightweight DTO (used by API routes and tests).
     */
    private async handleFromDTO(dto: CreateOrderDTO): Promise<Result<Order, AppError>> {
        try {
            const eventDate = new Date(dto.eventDate);

            const orderResult = Order.create({
                clientId: new UniqueEntityID(dto.clientId),
                state: 'DRAFT',
                eventDate,
                deliveryAddress: dto.deliveryAddress,
                eventType: dto.eventType,
                estimatedGuests: dto.estimatedGuests,
                specialInstructions: dto.specialInstructions,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            if (orderResult.isFailure()) {
                return fail(AppError.businessRule(orderResult.error));
            }
            const order = orderResult.unwrap();

            const savedResult = await this.orderRepository.save(order);
            if (savedResult.isFailure()) {
                return fail(AppError.from(new Error(savedResult.error)));
            }

            const events = order.pullDomainEvents();
            if (events.length > 0) {
                const publishResult = await this.eventPublisher.publishMany(events);
                if (publishResult.isFailure()) {
                    console.warn('Events published with partial failures:', publishResult.error);
                }
            }

            return ok(order);
        } catch (error) {
            if (error instanceof DomainError) {
                return fail(AppError.businessRule(error.message));
            }
            return fail(AppError.from(error));
        }
    }
}
