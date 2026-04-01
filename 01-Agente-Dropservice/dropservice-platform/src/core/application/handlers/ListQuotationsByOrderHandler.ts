import { Result, Success } from '@/core/shared/Result'
import { AppError } from '@/core/shared/AppError'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IQuotationRepository } from '@app/ports/IQuotationRepository'
import { Quotation } from '@/core/domain/aggregates/quotation/Quotation'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'

export class ListQuotationsByOrderHandler extends InstrumentedHandler<{ orderId: string }, Quotation[]> {
  protected handlerName = 'ListQuotationsByOrder'
  protected operationType = 'query' as const

  constructor(private readonly quotationRepository: IQuotationRepository) {
    super()
  }

  protected async handle(query: { orderId: string }): Promise<Result<Quotation[], AppError>> {
    const quotationsResult = await this.quotationRepository.findByOrder(new UniqueEntityID(query.orderId))
    if (quotationsResult.isFailure()) return quotationsResult as any
    return new Success(quotationsResult.getValue() || [])
  }

  protected extractSpanAttributes(query: { orderId: string }) {
    return { 'order.id': query.orderId }
  }
}
