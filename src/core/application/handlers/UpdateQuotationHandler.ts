import { Result, ok, fail } from '@core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IQuotationRepository } from '@app/ports/IQuotationRepository';
import { Quotation } from '@core/domain/aggregates/quotation/Quotation'
import { QuotationPricing } from '@core/domain/aggregates/order/QuotationPricing'
import { Money, Currency } from '@core/domain/value-objects/Money'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { UpdateQuotationCommand } from '../commands/UpdateQuotationCommand'
import { TAX_CONFIG } from '@domain/pricing/TaxConfig'
import { AppError } from '@/core/shared/AppError'

export class UpdateQuotationHandler extends InstrumentedHandler<UpdateQuotationCommand, Quotation, AppError> {
  protected handlerName = 'UpdateQuotation'
  protected operationType = 'command' as const

  constructor(private readonly quotationRepository: IQuotationRepository) {
    super()
  }

  protected async handle(command: UpdateQuotationCommand): Promise<Result<Quotation, AppError>> {
    const quotationResult = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId))
    if (quotationResult.isFailure()) return quotationResult
    
    const quotation = quotationResult.unwrap()
    if (!quotation) return fail(AppError.notFound('Quotation', command.quotationId))

    const updates = command.updates
    const currentPricing = quotation.pricing

    // Pricing update if costs/rates changed
    if (updates.providerCost !== undefined || updates.commissionRate !== undefined) {
      const providerCostRes = Money.create(
        updates.providerCost ?? currentPricing.providerCost.amount, 
        (updates.currency as Currency) ?? currentPricing.providerCost.currency
      )
      if (providerCostRes.isFailure()) {
          return fail(AppError.validation(providerCostRes.getError()))
      }

      const commissionRate = updates.commissionRate ?? (currentPricing.adminCommission.amount / currentPricing.providerCost.amount)

      const pricingResult = QuotationPricing.calculate(providerCostRes.unwrap(), { 
        commissionRate,
        platformFeeRate: 0.05,
        taxRate: TAX_CONFIG.IVA_RATE
      })
      
      if (pricingResult.isFailure()) {
          return fail(AppError.business(pricingResult.getError()))
      }
      
      const updateRes = quotation.updatePricing(pricingResult.unwrap())
      if (updateRes.isFailure()) {
          return fail(AppError.business(updateRes.getError()))
      }
    }

    // Additional updates (notes, items, etc) could be added here
    if (updates.providerNotes) {
      quotation.addProviderNotes(updates.providerNotes)
    }

    const saveResult = await this.quotationRepository.save(quotation)
    if (saveResult.isFailure()) return saveResult

    return ok(quotation)
  }

  protected extractSpanAttributes(command: UpdateQuotationCommand) {
    return { 'quotation.id': command.quotationId }
  }
}
