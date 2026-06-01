import { Result, ok, fail } from '@core/shared/Result'
import { IOrderRepository } from '@app/ports/IOrderRepository'
import { IQuotationRepository } from '@app/ports/IQuotationRepository'
import { Order } from '@core/domain/aggregates/order/Order'
import { Quotation } from '@core/domain/aggregates/quotation/Quotation'
import { QuotationRequestedItem } from '@core/domain/aggregates/quotation/QuotationRequestedItem'
import { Money } from '@core/domain/value-objects/Money'
import { QuotationPricing } from '@core/domain/aggregates/order/QuotationPricing'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { CreateQuotationRequestCommand } from '../../commands/CreateQuotationRequestCommand'
import { AppError } from '@/core/shared/AppError'

export class CreateQuotationRequestHandler {
    constructor(
        private readonly orderRepository: IOrderRepository,
        private readonly quotationRepository: IQuotationRepository
    ) { }

    async execute(command: CreateQuotationRequestCommand): Promise<Result<{ quotationId: string; code: string }, AppError>> {
        try {
            // 1. Create Order (DRAFT)
            const orderResult = Order.create({
                clientId: new UniqueEntityID(command.clientId || 'system-client'),
                state: 'QUOTATION_PENDING',
                eventDate: new Date(command.eventDate),
                deliveryAddress: command.venueAddress,
                specialInstructions: command.brief,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            if (orderResult.isFailure()) {
                return fail(AppError.businessRule(orderResult.getError()));
            }

            const order = orderResult.unwrap();
            const orderSaveRes = await this.orderRepository.save(order);
            if (orderSaveRes.isFailure()) {
                return fail(orderSaveRes.getError());
            }

            // 2. Create Quotation (PENDING_ASSIGNMENT)
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 7);

            const pricingRes = QuotationPricing.fromSimpleMarkup(Money.zero('CLP'), 0, 0);
            if (pricingRes.isFailure()) return fail(AppError.businessRule(pricingRes.getError()));

            const requestedItems: QuotationRequestedItem[] = [];
            if (command.items && command.items.length > 0) {
                for (const item of command.items) {
                    const itemRes = QuotationRequestedItem.create(item.serviceId, item.quantity);
                    if (itemRes.isSuccess()) requestedItems.push(itemRes.getValue());
                }
            }

            const quotationResult = Quotation.create({
                orderId: order.orderId,
                providerId: new UniqueEntityID('pending'), // Placeholder until assigned
                status: 'PENDING_ASSIGNMENT',
                pricing: pricingRes.getValue(),
                serviceDescription: command.brief,
                includes: [],
                excludes: [],
                validUntil,
                estimatedDeliveryDays: 0,
                requestedItems,
                providerItems: [],
                clientItems: [],
                items: [],
                eventDate: order.eventDate,
                clientId: order.clientId.toString(),
                serviceId: command.serviceId || 'GENERIC',
                code: `QT-${order.orderId.toString().substring(0, 8).toUpperCase()}`,
                subtotalServicesProvider: Money.zero('CLP'),
                subtotalLogisticsProvider: Money.zero('CLP'),
                totalProviderNet: Money.zero('CLP'),
                commissionServicesNet: Money.zero('CLP'),
                commissionLogisticsNet: Money.zero('CLP'),
                totalCommissionNet: Money.zero('CLP'),
                commissionMethod: 'PORCENTAJE',
                totalNet: Money.zero('CLP'),
                totalIva: Money.zero('CLP'),
                totalWithIva: Money.zero('CLP'),
                providerSuggestsTechnicalVisit: command.needsTechnicalVisit,
                technicalVisit: command.needsTechnicalVisit,
                expiresAt: validUntil,
                eventAddress: command.venueAddress,
                eventEndTime: command.eventEndTime,
                clientEmail: command.clientEmail,
                clientRut: command.clientRut,
                createdAt: new Date(),
            });

            if (quotationResult.isFailure()) {
                return fail(AppError.businessRule(quotationResult.getError() as string));
            }

            const quotation = quotationResult.unwrap();
            const quoteSaveRes = await this.quotationRepository.save(quotation);
            if (quoteSaveRes.isFailure()) return fail(quoteSaveRes.getError());

            // Persistir de forma defensiva el teléfono y nombre en profiles para mantener la integridad de los datos
            const clientIdStr = command.clientId || order.clientId.toString();
            if (clientIdStr && clientIdStr !== 'system-client' && (command.clientPhone || command.clientName)) {
                try {
                    const { createServiceRoleClient } = await import('@/lib/supabase/api');
                    const supabase = createServiceRoleClient();
                    const updates: Record<string, string> = {};
                    if (command.clientPhone) updates.phone = command.clientPhone;
                    if (command.clientName) updates.name = command.clientName;
                    
                    if (Object.keys(updates).length > 0) {
                        await supabase
                            .from('profiles')
                            .update(updates)
                            .eq('id', clientIdStr);
                    }
                } catch (err) {
                    // Fallback silencioso para no bloquear la creación de cotizaciones
                }
            }

            return ok({
                quotationId: quotation.id.toString(),
                code: quotation.code
            });

        } catch (error) {
            return fail(AppError.from(error));
        }
    }
}
