import { describe, it, expect, beforeEach } from 'vitest'
import { AdminDashboardHandler } from './AdminDashboardHandler'
import { CreateOrderHandler } from './order/CreateOrderUseCase'
import { InMemoryOrderRepository } from '@/tests/mocks/InMemoryOrderRepository'
import { InMemoryEventPublisher } from '@/tests/mocks/InMemoryEventPublisher'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'
import { Money } from '@/core/domain/value-objects/Money'
import { QuotationPricing } from '@/core/domain/aggregates/order/QuotationPricing'

describe('AdminDashboardHandler', () => {
  let handler: AdminDashboardHandler
  let createHandler: CreateOrderHandler
  let orderRepository: InMemoryOrderRepository
  let eventPublisher: InMemoryEventPublisher

  beforeEach(() => {
    orderRepository = new InMemoryOrderRepository()
    eventPublisher = new InMemoryEventPublisher()
    handler = new AdminDashboardHandler(orderRepository)
    createHandler = new CreateOrderHandler(orderRepository, eventPublisher)
  })

  const createOrderInState = async (state: string, withPricing: boolean = false) => {
    const result = await createHandler.handle({
      clientId: 'client-' + Math.random().toString(36).substr(2, 5),
      serviceId: 'service-123',
      requirements: 'Requirements description',
      deadlineDays: 7,
      priceAmount: 10000
    })

    const order = result.unwrap()

    if (state !== 'DRAFT') {
      order.transition('QUOTATION_PENDING')
      order.assignProvider(new UniqueEntityID('provider-456'))

      if (withPricing) {
        const cost = Money.create(10000, 'USD').unwrap()
        const pricing = QuotationPricing.calculate(cost, {
          commissionRate: 0.30,
          platformFeeRate: 0.05,
          taxRate: 0.16
        }).unwrap()
        order.attachQuotation(new UniqueEntityID('q-' + Date.now()), pricing)
      }
    }

    if (['QUOTATION_SENT', 'QUOTATION_APPROVED', 'PAYMENT_PENDING',
         'PAYMENT_RECEIVED', 'IN_PRODUCTION', 'DELIVERED', 'COMPLETED'
    ].includes(state)) {
      if (!order.hasQuotation) {
        const cost = Money.create(10000, 'USD').unwrap()
        const pricing = QuotationPricing.calculate(cost, {
          commissionRate: 0.30,
          platformFeeRate: 0.05,
          taxRate: 0.16
        }).unwrap()
        order.attachQuotation(new UniqueEntityID('q-' + Date.now()), pricing)
      }
      order.transition('QUOTATION_SENT')
    }

    if (['QUOTATION_APPROVED', 'PAYMENT_PENDING', 'PAYMENT_RECEIVED',
         'IN_PRODUCTION', 'DELIVERED', 'COMPLETED'
    ].includes(state)) {
      order.approveQuotation()
    }

    if (['PAYMENT_PENDING', 'PAYMENT_RECEIVED', 'IN_PRODUCTION',
         'DELIVERED', 'COMPLETED'
    ].includes(state)) {
      order.transition('PAYMENT_PENDING')
    }

    if (['PAYMENT_RECEIVED', 'IN_PRODUCTION', 'DELIVERED', 'COMPLETED'
    ].includes(state)) {
      order.confirmPayment()
    }

    if (['IN_PRODUCTION', 'DELIVERED', 'COMPLETED'].includes(state)) {
      order.startProduction()
    }

    if (['DELIVERED', 'COMPLETED'].includes(state)) {
      order.markAsDelivered()
    }

    if (state === 'COMPLETED') {
      order.complete()
    }

    if (state === 'CANCELLED') {
      if (order.state === 'DRAFT') {
        order.transition('QUOTATION_PENDING')
      }
      order.cancel('Test cancellation')
    }

    await orderRepository.save(order)
    return order
  }

  it('should return empty dashboard when no orders', async () => {
    const result = await handler.execute()

    expect(result.isSuccess()).toBe(true)
    const data = result.unwrap()
    expect(data.summary.totalOrders).toBe(0)
    expect(data.summary.activeOrders).toBe(0)
    expect(data.summary.totalRevenue).toBe(0)
  })

  it('should count orders by state', async () => {
    await createOrderInState('DRAFT')
    await createOrderInState('DRAFT')
    await createOrderInState('QUOTATION_PENDING', true)
    await createOrderInState('COMPLETED')
    await createOrderInState('CANCELLED')

    const result = await handler.execute()

    expect(result.isSuccess()).toBe(true)
    const data = result.unwrap()
    expect(data.summary.totalOrders).toBe(5)
    expect(data.ordersByState['DRAFT']).toBe(2)
    expect(data.ordersByState['COMPLETED']).toBe(1)
    expect(data.ordersByState['CANCELLED']).toBe(1)
  })

  it('should calculate revenue from paid orders', async () => {
    await createOrderInState('PAYMENT_RECEIVED')
    await createOrderInState('COMPLETED')
    await createOrderInState('DRAFT') // No revenue from draft

    const result = await handler.execute()

    const data = result.unwrap()
    expect(data.summary.totalRevenue).toBeGreaterThan(0)
    expect(data.summary.totalProfit).toBeGreaterThan(0)
  })

  it('should return recent orders sorted by date', async () => {
    await createOrderInState('DRAFT')
    await createOrderInState('QUOTATION_PENDING', true)
    await createOrderInState('COMPLETED')

    const result = await handler.execute()

    const data = result.unwrap()
    expect(data.recentOrders.length).toBeLessThanOrEqual(10)
    expect(data.recentOrders.length).toBeGreaterThan(0)

    // Verify sorted by created_at descending
    for (let i = 1; i < data.recentOrders.length; i++) {
      const prev = new Date(data.recentOrders[i - 1].createdAt)
      const curr = new Date(data.recentOrders[i].createdAt)
      expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime())
    }
  })

  it('should separate active from completed/cancelled', async () => {
    await createOrderInState('DRAFT')
    await createOrderInState('QUOTATION_PENDING', true)
    await createOrderInState('COMPLETED')
    await createOrderInState('CANCELLED')

    const result = await handler.execute()

    const data = result.unwrap()
    expect(data.summary.activeOrders).toBe(2)
    expect(data.summary.completedOrders).toBe(1)
    expect(data.summary.cancelledOrders).toBe(1)
  })
})
