import { Result } from '@core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IQuotationRepository } from '@app/ports/IQuotationRepository'
import { IDomainEventBus } from '@app/ports/IDomainEventBus'
import { Quotation } from '@core/domain/aggregates/quotation/Quotation'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { SendQuotationToClientCommand } from '../commands/SendQuotationToClientCommand'

export class SendQuotationToClientHandler extends InstrumentedHandler<SendQuotationToClientCommand, Quotation> {
  protected handlerName = 'SendQuotationToClient'
  protected operationType = 'command' as const

  constructor(
    private readonly quotationRepository: IQuotationRepository,
    private readonly eventBus: IDomainEventBus
  ) { super() }

  protected async handle(command: SendQuotationToClientCommand): Promise<Result<Quotation, string>> {
    const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId))
    if (quotationRes.isFailure()) return Result.fail(quotationRes.getError())
    
    const quotation = quotationRes.getValue()
    if (!quotation) return Result.fail('Cotización no encontrada')

    if (command.adminNotes) {
      quotation.addAdminNotes(command.adminNotes)
    }

    const sendRes = quotation.sendToClient()
    if (sendRes.isFailure()) return Result.fail(sendRes.getError())

    const saveResult = await this.quotationRepository.save(quotation)
    if (saveResult.isFailure()) return Result.fail(saveResult.getError())

    const events = quotation.pullDomainEvents()
    if (events.length > 0) {
      const transportEvents = events.map(e => e.toJSON() as any);
      await this.eventBus.publishAll(transportEvents)
    }

    return Result.ok(quotation)
  }

  protected extractSpanAttributes(command: SendQuotationToClientCommand) {
    return { 'quotation.id': command.quotationId, 'admin.id': command.adminId }
  }
}
