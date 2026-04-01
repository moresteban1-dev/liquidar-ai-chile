import { ICommandHandler } from '@core/shared/ICommandHandler';
import { Result, ok, fail } from '@core/shared/Result';
import { IQuotationRepository as QuotationRepository } from '@app/ports/IQuotationRepository';
import { IOrderRepository as OrderRepository } from '@app/ports/IOrderRepository';
import { AppError } from '@core/shared/AppError';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';

export class ApproveQuotationCommand {
    readonly commandName = 'ApproveQuotationCommand';
    constructor(public readonly quotationId: string) { }
}

/**
 * Handler for approving and paying a quotation.
 * Implements core domain logic for state transition and order creation.
 */
export class ApproveQuotationHandler implements ICommandHandler<ApproveQuotationCommand, string> {
    constructor(
        private quotationRepository: QuotationRepository,
        private orderRepository: OrderRepository
    ) { }

    async handle(command: ApproveQuotationCommand): Promise<Result<string, AppError>> {
        // 1. Fetch Aggregate
        const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId));
        if (quotationRes.isFailure()) return fail(AppError.from(quotationRes.getError()));

        const quotation = quotationRes.getValue();
        if (!quotation) return fail(AppError.notFound(`Quotation with ID ${command.quotationId} not found`));

        // 2. Domain Logic: State Transition
        const transitionRes = quotation.markAsPaid();
        if (transitionRes.isFailure()) return fail(AppError.businessRule(transitionRes.getError()));

        try {
            // 3. Side Effect: Create Order (Persistence)
            // Ensure totalWithIva exists before creating order
            const price = quotation.props.totalWithIva;
            if (!price || price.amount <= 0) {
                return fail(AppError.businessRule('Cannot approve a quotation without a valid total price.'));
            }

            const orderCreationRes = await this.orderRepository.createFromQuotation(
                quotation.id.toString(),
                price.amount
            );

            if (orderCreationRes.isFailure()) {
                return fail(AppError.from(orderCreationRes.getError()));
            }

            const orderId = orderCreationRes.getValue();

            // 4. Persistence of Aggregate State
            await this.quotationRepository.save(quotation);

            return ok(orderId);
        } catch (error) {
            return fail(AppError.from(error));
        }
    }
}
