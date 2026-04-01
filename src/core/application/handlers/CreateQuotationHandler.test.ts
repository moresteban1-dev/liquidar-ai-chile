import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateQuotationHandler } from './CreateQuotationHandler'
import { IOrderRepository } from '@app/ports/IOrderRepository'
import { IQuotationRepository } from '@app/ports/IQuotationRepository'
import { IEventPublisher } from '@core/application/ports/events/IEventPublisher'
import { Result, ok } from '@core/shared/Result'
import { Order } from '@core/domain/aggregates/order/Order'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'

describe('CreateQuotationHandler', () => {
  let handler: CreateQuotationHandler
  let mockOrderRepo: vi.Mocked<IOrderRepository>
  let mockQuotationRepo: vi.Mocked<IQuotationRepository>
  let mockEventPublisher: vi.Mocked<IEventPublisher>

  beforeEach(() => {
    mockOrderRepo = {
      findById: vi.fn(),
      save: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn()
    } as any

    mockQuotationRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByOrder: vi.fn()
    } as any

    mockEventPublisher = {
      publish: vi.fn(),
      publishMany: vi.fn()
    } as any

    handler = new CreateQuotationHandler(mockOrderRepo, mockQuotationRepo, mockEventPublisher)
  })

  it('should create a quotation successfully', async () => {
    const providerId = new UniqueEntityID()
    const order = Order.create({
      clientId: new UniqueEntityID(),
      providerId: providerId,
      state: 'QUOTATION_PENDING',
      eventDate: new Date(Date.now() + 86400000),
      deliveryAddress: 'Test Address',
      createdAt: new Date(),
      updatedAt: new Date()
    }).unwrap()

    mockOrderRepo.findById.mockResolvedValue(ok(order))
    mockQuotationRepo.save.mockResolvedValue(ok(undefined))
    mockEventPublisher.publishMany.mockResolvedValue()

    const result = await handler.handle({
      commandName: 'CreateQuotation',
      orderId: order.id.toString(),
      providerId: providerId.toString(),
      providerCost: 1000,
      currency: 'MXN',
      commissionRate: 0.1,
      serviceDescription: 'Test Description',
      includes: [],
      excludes: [],
      validDays: 7,
      estimatedDeliveryDays: 2
    })

    expect(result.isSuccess()).toBe(true)
    expect(mockQuotationRepo.save).toHaveBeenCalled()
    expect(result.unwrap().status).toBe('DRAFT')
  })

  it('should fail if order is not in QUOTATION_PENDING state', async () => {
    const order = Order.create({
      clientId: new UniqueEntityID(),
      state: 'DRAFT', // WRONG STATE
      eventDate: new Date(Date.now() + 86400000),
      deliveryAddress: 'Test Address',
      createdAt: new Date(),
      updatedAt: new Date()
    }).unwrap()

    mockOrderRepo.findById.mockResolvedValue(ok(order))

    const result = await handler.handle({
      commandName: 'CreateQuotation',
      orderId: order.id.toString(),
      providerId: 'any',
      providerCost: 1000,
      currency: 'MXN',
      commissionRate: 0.1,
      serviceDescription: 'Test',
      includes: [],
      excludes: [],
      validDays: 7,
      estimatedDeliveryDays: 2
    })

    expect(result.isFailure()).toBe(true)
    expect(result.getError().code).toBe('BUSINESS_RULE_VIOLATION')
  })
})
