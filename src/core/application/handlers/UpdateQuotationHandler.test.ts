import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateQuotationHandler } from './UpdateQuotationHandler'
import { InMemoryQuotationRepository } from '@/tests/mocks/InMemoryQuotationRepository'
import { Quotation } from '@/core/domain/aggregates/quotation/Quotation'
import { QuotationPricing } from '@/core/domain/aggregates/order/QuotationPricing'
import { Money } from '@/core/domain/value-objects/Money'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'

describe('UpdateQuotationHandler', () => {
  let handler: UpdateQuotationHandler
  let quotationRepository: InMemoryQuotationRepository

  beforeEach(() => {
    quotationRepository = new InMemoryQuotationRepository()
    handler = new UpdateQuotationHandler(quotationRepository)
  })

  const createQuotation = async (status: string = 'DRAFT') => {
    const cost = Money.create(50000, 'MXN').unwrap()
    const pricing = QuotationPricing.calculate(cost, {
      commissionRate: 0.25,
      platformFeeRate: 0.05,
      taxRate: 0.16
    }).unwrap()

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 7)

    const quotation = Quotation.create({
      orderId: new UniqueEntityID('order-123'),
      providerId: new UniqueEntityID('provider-456'),
      status: status as any,
      pricing,
      serviceDescription: 'Original description',
      includes: ['Service A', 'Service B'],
      excludes: ['Service C'],
      validUntil,
      estimatedDeliveryDays: 3,
      createdAt: new Date()
    }).unwrap()

    await quotationRepository.save(quotation)
    return quotation
  }

  describe('Success Cases', () => {
    it('should update service description', async () => {
      const quotation = await createQuotation()

      const result = await handler.execute({
        quotationId: quotation.quotationId.toString(),
        providerId: 'provider-456',
        updates: {
          serviceDescription: 'Updated premium description'
        }
      })

      expect(result.isSuccess()).toBe(true)
      expect(result.unwrap().serviceDescription).toBe('Updated premium description')
    })

    it('should update provider cost and recalculate pricing', async () => {
      const quotation = await createQuotation()
      const originalPrice = quotation.pricing.finalPrice.amount

      const result = await handler.execute({
        quotationId: quotation.quotationId.toString(),
        providerId: 'provider-456',
        updates: {
          providerCost: 60000
        }
      })

      expect(result.isSuccess()).toBe(true)
      const updated = result.unwrap()
      expect(updated.pricing.providerCost.amount).toBe(60000)
      expect(updated.pricing.finalPrice.amount).toBeGreaterThan(originalPrice)

      // Verify invariant holds
      expect(updated.pricing.validate().isSuccess()).toBe(true)
    })

    it('should update commission rate', async () => {
      const quotation = await createQuotation()

      const result = await handler.execute({
        quotationId: quotation.quotationId.toString(),
        providerId: 'provider-456',
        updates: {
          commissionRate: 0.35
        }
      })

      expect(result.isSuccess()).toBe(true)
      const updated = result.unwrap()
      // 50000 * 0.35 = 17500
      expect(updated.pricing.adminCommission.amount).toBe(17500)
    })

    it('should update includes and excludes', async () => {
      const quotation = await createQuotation()

      const result = await handler.execute({
        quotationId: quotation.quotationId.toString(),
        providerId: 'provider-456',
        updates: {
          includes: ['New Service X', 'New Service Y', 'New Service Z'],
          excludes: []
        }
      })

      expect(result.isSuccess()).toBe(true)
      const updated = result.unwrap()
      expect(updated.includes).toHaveLength(3)
      expect(updated.includes).toContain('New Service X')
      expect(updated.excludes).toHaveLength(0)
    })

    it('should update SUBMITTED quotation', async () => {
      const quotation = await createQuotation('SUBMITTED')

      const result = await handler.execute({
        quotationId: quotation.quotationId.toString(),
        providerId: 'provider-456',
        updates: {
          providerCost: 45000
        }
      })

      expect(result.isSuccess()).toBe(true)
    })
  })

  describe('Failure Cases', () => {
    it('should reject update by wrong provider', async () => {
      const quotation = await createQuotation()

      const result = await handler.execute({
        quotationId: quotation.quotationId.toString(),
        providerId: 'wrong-provider-999',
        updates: {
          providerCost: 60000
        }
      })

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('assigned provider')
    })

    it('should reject update of SENT_TO_CLIENT quotation', async () => {
      const quotation = await createQuotation('SENT_TO_CLIENT')

      const result = await handler.execute({
        quotationId: quotation.quotationId.toString(),
        providerId: 'provider-456',
        updates: {
          providerCost: 60000
        }
      })

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('Only DRAFT and SUBMITTED')
    })

    it('should reject non-existent quotation', async () => {
      const result = await handler.execute({
        quotationId: 'non-existent',
        providerId: 'provider-456',
        updates: { providerCost: 60000 }
      })

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('not found')
    })
  })
})
