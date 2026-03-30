import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SubmitQuotationHandler } from './SubmitQuotationHandler'
import { IQuotationRepository } from '@app/ports/IQuotationRepository'
import { IEventPublisher } from '@core/application/ports/events/IEventPublisher'
import { Result, ok } from '@core/shared/Result'
import { Quotation } from '@core/domain/aggregates/quotation/Quotation'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { Money } from '@core/domain/value-objects/Money'
import { QuotationPricing } from '@core/domain/aggregates/order/QuotationPricing'

describe('SubmitQuotationHandler', () => {
  let handler: SubmitQuotationHandler
  let mockQuotationRepo: vi.Mocked<IQuotationRepository>
  let mockEventPublisher: vi.Mocked<IEventPublisher>

  const providerId = new UniqueEntityID()
  const pricing = QuotationPricing.calculate(Money.create(100, 'MXN').unwrap(), {
    commissionRate: 0.15,
    platformFeeRate: 0.03,
    taxRate: 0.16
  }).unwrap()

  beforeEach(() => {
    mockQuotationRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByOrder: vi.fn(),
      findByProvider: vi.fn(),
      delete: vi.fn(),
      getClientEmail: vi.fn()
    } as any

    mockEventPublisher = {
      publish: vi.fn(),
      publishMany: vi.fn()
    } as any

    handler = new SubmitQuotationHandler(mockQuotationRepo, mockEventPublisher)
  })

  it('should submit a quotation successfully', async () => {
    const quotation = Quotation.create({
      orderId: new UniqueEntityID(),
      providerId: providerId,
      status: 'DRAFT',
      pricing,
      serviceDescription: 'Test',
      includes: [],
      excludes: [],
      validUntil: new Date(Date.now() + 86400000),
      estimatedDeliveryDays: 1,
      createdAt: new Date()
    }).unwrap()

    mockQuotationRepo.findById.mockResolvedValue(ok(quotation))
    mockQuotationRepo.save.mockResolvedValue(ok(undefined))
    mockEventPublisher.publishMany.mockResolvedValue()

    const result = await handler.handle({
      commandName: 'SubmitQuotation',
      quotationId: quotation.quotationId.toString(),
      providerId: providerId.toString()
    })

    expect(result.isSuccess()).toBe(true)
    expect(quotation.status).toBe('SUBMITTED')
    expect(mockQuotationRepo.save).toHaveBeenCalled()
  })

  it('should fail if caller is not the owner', async () => {
    const quotation = Quotation.create({
        orderId: new UniqueEntityID(),
        providerId: providerId, // Owner
        status: 'DRAFT',
        pricing,
        serviceDescription: 'Test',
        includes: [],
        excludes: [],
        validUntil: new Date(),
        estimatedDeliveryDays: 1,
        createdAt: new Date()
      }).unwrap()
  
      mockQuotationRepo.findById.mockResolvedValue(ok(quotation))

      const result = await handler.handle({
        commandName: 'SubmitQuotation',
        quotationId: quotation.quotationId.toString(),
        providerId: 'wrong-provider'
      })

      expect(result.isFailure()).toBe(true)
      expect(result.getError().code).toBe('FORBIDDEN')
  })
})
