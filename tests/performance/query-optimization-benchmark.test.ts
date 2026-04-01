import { CreateOrderHandler } from '@core/application/handlers/order/CreateOrderUseCase'
import { ListOrdersByClientHandler } from '@core/application/handlers/ListOrdersByClientHandler'
import { AdminDashboardHandler } from '@core/application/handlers/AdminDashboardHandler'
import { InMemoryOrderRepository } from '../../tests/mocks/InMemoryOrderRepository'
import { InMemoryEventPublisher } from '../../tests/mocks/InMemoryEventPublisher'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'

describe('Query Optimization Benchmarks', () => {
  let orderRepo: InMemoryOrderRepository
  let eventPublisher: InMemoryEventPublisher
  let createOrder: CreateOrderHandler

  beforeEach(async () => {
    orderRepo = new InMemoryOrderRepository()
    eventPublisher = new InMemoryEventPublisher()
    createOrder = new CreateOrderHandler(orderRepo, eventPublisher)

    for (let i = 0; i < 200; i++) {
      const result = await createOrder.execute({
        clientId: `bench-client-${i % 10}`,
        eventDate: `2026-${String((i % 12) + 1).padStart(2, '0')}-15T00:00:00.000Z`,
        eventType: i % 3 === 0 ? 'wedding' : 'corporate',
        estimatedGuests: 50 + (i * 5),
        deliveryAddress: `Address ${i}`
      })

      if (result.isSuccess()) {
        const order = result.unwrap()
        if (i % 5 === 0) {
          order.transition('QUOTATION_PENDING')
          order.assignProvider(new UniqueEntityID(`bench-provider-${i % 3}`))
        }
        await orderRepo.save(order)
      }
    }
  })

  describe('List Orders Performance', () => {
    it('should list orders by client within 50ms', async () => {
      const handler = new ListOrdersByClientHandler(orderRepo)
      const start = performance.now()
      const result = await handler.execute({ clientId: 'bench-client-0', pagination: { page: 1, pageSize: 20 } })
      const duration = performance.now() - start
      expect(result.isSuccess()).toBe(true)
      expect(duration).toBeLessThan(50)
    })

    it('should filter orders by state within 50ms', async () => {
      const handler = new ListOrdersByClientHandler(orderRepo)
      const start = performance.now()
      const result = await handler.execute({ clientId: 'bench-client-0', filters: { state: 'DRAFT' }, pagination: { page: 1, pageSize: 20 } })
      const duration = performance.now() - start
      expect(result.isSuccess()).toBe(true)
      expect(duration).toBeLessThan(50)
    })
  })

  describe('Dashboard Performance', () => {
    it('should generate dashboard within 200ms', async () => {
      const handler = new AdminDashboardHandler(orderRepo)
      const start = performance.now()
      const result = await handler.execute(undefined as any)
      const duration = performance.now() - start
      expect(result.isSuccess()).toBe(true)
      expect(duration).toBeLessThan(200)
    })
  })

  describe('Concurrent Query Performance', () => {
    it('should handle 20 concurrent list queries within 500ms', async () => {
      const handler = new ListOrdersByClientHandler(orderRepo)
      const start = performance.now()
      const promises = Array.from({ length: 20 }, (_, i) =>
        handler.execute({ clientId: `bench-client-${i % 10}`, pagination: { page: 1, pageSize: 10 } })
      )
      const results = await Promise.all(promises)
      const duration = performance.now() - start
      expect(results.every((r: any) => r.isSuccess())).toBe(true)
      expect(duration).toBeLessThan(500)
    })
  })
})
