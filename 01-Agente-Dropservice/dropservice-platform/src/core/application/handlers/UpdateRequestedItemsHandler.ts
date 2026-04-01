import { Result, ok, fail } from '@core/shared/Result'
import { AppError } from '@core/shared/AppError'
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

  public async handle(
    command: UpdateRequestedItemsCommand,
  ): Promise<Result<Quotation, AppError>> {
    const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId))
    if (quotationRes.isFailure()) {
        return fail(AppError.business(String(quotationRes.getError())))
    }
    
    const quotation = quotationRes.unwrap()
    if (!quotation) return fail(AppError.notFound('Cotización', command.quotationId))

    const items: QuotationRequestedItem[] = []
    for (const itemData of command.items) {
      const itemRes = QuotationRequestedItem.create(itemData.itemName, itemData.quantity, itemData.sortOrder)
      if (itemRes.isFailure()) return fail(AppError.validation(String(itemRes.getError())))
      items.push(itemRes.getValue())
    }

    const updateRes = quotation.updateRequestedItems(items)
    if (updateRes.isFailure()) return fail(AppError.validation(String(updateRes.getError())))

    const saveResult = await this.quotationRepository.save(quotation)
    if (saveResult.isFailure()) return fail(AppError.business(String(saveResult.getError())))

    return ok(quotation)
  }

  protected extractSpanAttributes(command: UpdateRequestedItemsCommand) {
    return { 'quotation.id': command.quotationId, 'items.count': command.items.length }
  }
}
