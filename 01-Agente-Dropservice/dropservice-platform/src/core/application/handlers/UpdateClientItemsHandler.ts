import { Result } from '@core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IQuotationRepository } from '@app/ports/IQuotationRepository'
import { Quotation } from '@core/domain/aggregates/quotation/Quotation'
import { QuotationClientItem } from '@core/domain/aggregates/quotation/QuotationClientItem'
import { Money, Currency } from '@core/domain/value-objects/Money'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { UpdateClientItemsCommand } from '../commands/UpdateClientItemsCommand'

export class UpdateClientItemsHandler extends InstrumentedHandler<UpdateClientItemsCommand, Quotation> {
  protected handlerName = 'UpdateClientItems'
  protected operationType = 'command' as const

  constructor(private readonly quotationRepository: IQuotationRepository) {
    super()
  }

  protected async handle(command: UpdateClientItemsCommand): Promise<Result<Quotation, string>> {
    const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId))
    if (quotationRes.isFailure()) return Result.fail(quotationRes.getError())
    
    const quotation = quotationRes.getValue()
    if (!quotation) return Result.fail('Cotización no encontrada')

    const items: QuotationClientItem[] = []
    for (const itemData of command.items) {
      const unitPriceRes = Money.create(itemData.unitPrice, itemData.currency as Currency)
      if (unitPriceRes.isFailure()) return Result.fail(unitPriceRes.getError())

      const itemRes = QuotationClientItem.create(
        itemData.description, 
        unitPriceRes.getValue(), 
        itemData.quantity, 
        itemData.sortOrder
      )
      if (itemRes.isFailure()) return Result.fail(itemRes.getError())
      items.push(itemRes.getValue())
    }

    const updateRes = quotation.updateClientItems(items)
    if (updateRes.isFailure()) return Result.fail(updateRes.getError())

    const saveResult = await this.quotationRepository.save(quotation)
    if (saveResult.isFailure()) return Result.fail(saveResult.getError())

    return Result.ok(quotation)
  }

  protected extractSpanAttributes(command: UpdateClientItemsCommand) {
    return { 'quotation.id': command.quotationId, 'items.count': command.items.length }
  }
}
