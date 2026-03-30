import { Result } from '@core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IQuotationRepository } from '@app/ports/IQuotationRepository'
import { Quotation } from '@core/domain/aggregates/quotation/Quotation'
import { QuotationProviderItem } from '@core/domain/aggregates/quotation/QuotationProviderItem'
import { Money, Currency } from '@core/domain/value-objects/Money'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { UpdateProviderItemsCommand } from '../commands/UpdateProviderItemsCommand'

export class UpdateProviderItemsHandler extends InstrumentedHandler<UpdateProviderItemsCommand, Quotation> {
  protected handlerName = 'UpdateProviderItems'
  protected operationType = 'command' as const

  constructor(private readonly quotationRepository: IQuotationRepository) {
    super()
  }

  protected async handle(command: UpdateProviderItemsCommand): Promise<Result<Quotation, string>> {
    const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId))
    if (quotationRes.isFailure()) return Result.fail(quotationRes.getError())
    
    const quotation = quotationRes.getValue()
    if (!quotation) return Result.fail('Cotización no encontrada')

    const items: QuotationProviderItem[] = []
    for (const itemData of command.items) {
      const unitPriceRes = Money.create(itemData.unitPrice, itemData.currency as Currency)
      if (unitPriceRes.isFailure()) return Result.fail(unitPriceRes.getError())

      const itemRes = QuotationProviderItem.create(
        itemData.category, 
        itemData.concept, 
        unitPriceRes.getValue(), 
        itemData.quantity, 
        itemData.sortOrder
      )
      if (itemRes.isFailure()) return Result.fail(itemRes.getError())
      items.push(itemRes.getValue())
    }

    const updateRes = quotation.updateProviderItems(items)
    if (updateRes.isFailure()) return Result.fail(updateRes.getError())

    const saveResult = await this.quotationRepository.save(quotation)
    if (saveResult.isFailure()) return Result.fail(saveResult.getError())

    return Result.ok(quotation)
  }

  protected extractSpanAttributes(command: UpdateProviderItemsCommand) {
    return { 'quotation.id': command.quotationId, 'items.count': command.items.length }
  }
}
