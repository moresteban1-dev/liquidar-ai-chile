import { Result } from '@core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IQuotationRepository } from '@app/ports/IQuotationRepository'
import { Quotation } from '@core/domain/aggregates/quotation/Quotation'
import { QuotationRequestedItem } from '@core/domain/aggregates/quotation/QuotationRequestedItem'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { UpdateRequestedItemsCommand } from '../commands/UpdateRequestedItemsCommand'

export class UpdateRequestedItemsHandler extends InstrumentedHandler<UpdateRequestedItemsCommand, Quotation> {
  protected handlerName = 'UpdateRequestedItems'
  protected operationType = 'command' as const

  constructor(private readonly quotationRepository: IQuotationRepository) {
    super()
  }

  protected async handle(command: UpdateRequestedItemsCommand): Promise<Result<Quotation, string>> {
    const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId))
    if (quotationRes.isFailure()) return Result.fail(quotationRes.getError())
    
    const quotation = quotationRes.getValue()
    if (!quotation) return Result.fail('Cotización no encontrada')

    const items: QuotationRequestedItem[] = []
    for (const itemData of command.items) {
      const itemRes = QuotationRequestedItem.create(itemData.itemName, itemData.quantity, itemData.sortOrder)
      if (itemRes.isFailure()) return Result.fail(itemRes.getError())
      items.push(itemRes.getValue())
    }

    const updateRes = quotation.updateRequestedItems(items)
    if (updateRes.isFailure()) return Result.fail(updateRes.getError())

    const saveResult = await this.quotationRepository.save(quotation)
    if (saveResult.isFailure()) return Result.fail(saveResult.getError())

    return Result.ok(quotation)
  }

  protected extractSpanAttributes(command: UpdateRequestedItemsCommand) {
    return { 'quotation.id': command.quotationId, 'items.count': command.items.length }
  }
}
