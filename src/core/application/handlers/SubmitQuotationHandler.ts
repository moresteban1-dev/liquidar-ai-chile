import { Result, ok, fail } from '@/core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IQuotationRepository as QuotationRepository } from '@app/ports/IQuotationRepository';
import { Quotation } from '@/core/domain/aggregates/quotation/Quotation'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'
import { AppError } from '@/core/shared/AppError'

export class SubmitQuotationHandler extends InstrumentedHandler<{ quotationId: string }, Quotation, AppError> {
  protected handlerName = 'SubmitQuotation'
  protected operationType = 'command' as const

  constructor(private readonly quotationRepository: QuotationRepository) {
    super()
  }

  public async handle(command: { quotationId: string }): Promise<Result<Quotation, AppError>> {
    const quotationResult = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId))
    if (quotationResult.isFailure()) return quotationResult
    
    const quotation = quotationResult.unwrap()
    if (!quotation) return fail(AppError.notFound('Quotation', command.quotationId))

    const submitResult = quotation.submit()
    if (submitResult.isFailure()) {
        return fail(AppError.business(submitResult.getError()))
    }

    const saveResult = await this.quotationRepository.save(quotation)
    if (saveResult.isFailure()) return saveResult

    return ok(quotation)
  }

  protected extractSpanAttributes(command: { quotationId: string }) {
    return { 'quotation.id': command.quotationId }
  }
}
