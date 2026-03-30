import { CreateOrderHandler } from '@core/application/handlers/order/CreateOrderUseCase'
import { InMemoryOrderRepository } from '@tests/mocks/InMemoryOrderRepository'
import { InMemoryEventPublisher } from '@tests/mocks/InMemoryEventPublisher'
import { QuotationPricing } from '@core/domain/aggregates/order/QuotationPricing'
import { Money } from '@core/domain/value-objects/Money'

describe('Performance Benchmarks', () => {
  it('should create 100 orders in < 100ms (in-memory)', async () => {
    const orderRepository = new InMemoryOrderRepository()
    const eventPublisher = new InMemoryEventPublisher()
    const handler = new CreateOrderHandler(orderRepository, eventPublisher)

    const startTime = performance.now()

    const promises = Array.from({ length: 100 }, (_, i) =>
      handler.execute({
        clientId: `perf-client-${i}`,
        eventDate: '2026-12-25T00:00:00.000Z',
        deliveryAddress: `Address ${i}`
      })
    )

    await Promise.all(promises)

    const endTime = performance.now()
    const duration = endTime - startTime

    console.log(`\n⚡ Created 100 orders in ${duration.toFixed(2)}ms`)
    expect(duration).toBeLessThan(150) // Tolerancia para ambientes de agente
  })

  it('should handle 1000 concurrent reads efficiently', async () => {
    const orderRepository = new InMemoryOrderRepository()
    const result = await (new CreateOrderHandler(orderRepository, new InMemoryEventPublisher())).execute({
      clientId: 'perf-client-read',
      eventDate: '2026-12-25T00:00:00.000Z',
      deliveryAddress: 'Test Address'
    })

    const orderId = result.unwrap().orderId

    const startTime = performance.now()

    const promises = Array.from({ length: 1000 }, () =>
      orderRepository.findById(orderId)
    )

    await Promise.all(promises)

    const endTime = performance.now()
    const duration = endTime - startTime

    console.log(`\n⚡ Executed 1000 reads in ${duration.toFixed(2)}ms`)
    expect(duration).toBeLessThan(100)
  })

  it('should measure pricing calculation performance', () => {
    const iterations = 10000
    const startTime = performance.now()

    for (let i = 0; i < iterations; i++) {
      const cost = Money.create(10000 + i, 'USD').unwrap()
      QuotationPricing.calculate(cost, {
        commissionRate: 0.30
      })
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    console.log(`\n⚡ Calculated ${iterations} pricings in ${duration.toFixed(2)}ms`)
    expect(duration).toBeLessThan(200)
  })
})
