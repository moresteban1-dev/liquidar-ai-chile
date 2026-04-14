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

    // Security Check: Only the assigned provider can update it
    if (quotation.providerId.toString() !== command.providerId) {
      return fail(AppError.forbidden('Only the assigned provider can update this quotation'))
    }

    const updates = command.updates
    const currentPricing = quotation.pricing

    // 1. Pricing update
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

    // 2. Content Updates (Advanced V2 logic)
    if (updates.serviceDescription) {
        (quotation as any).props.serviceDescription = updates.serviceDescription
    }
    if (updates.includes) {
        (quotation as any).props.includes = updates.includes
    }
    if (updates.excludes) {
        (quotation as any).props.excludes = updates.excludes
    }
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
