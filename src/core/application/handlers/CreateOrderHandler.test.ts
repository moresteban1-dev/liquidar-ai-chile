import { describe, it, expect, beforeEach } from 'vitest'
import { CreateOrderHandler } from './CreateOrderHandler'
import { CreateOrderCommand } from '../commands/CreateOrderCommand'
import { InMemoryOrderRepository } from '@tests/mocks/InMemoryOrderRepository'
import { InMemoryEventPublisher } from '@tests/mocks/InMemoryEventPublisher'

describe('CreateOrderHandler', () => {
  let handler: CreateOrderHandler
  let orderRepository: InMemoryOrderRepository
  let eventPublisher: InMemoryEventPublisher

  beforeEach(() => {
    orderRepository = new InMemoryOrderRepository()
    eventPublisher = new InMemoryEventPublisher()
    handler = new CreateOrderHandler(orderRepository, eventPublisher)
  })

  const createValidCommand = (): CreateOrderCommand => ({
    clientId: 'client-123',
    eventDate: '2026-12-25T00:00:00.000Z',
    eventType: 'wedding',
    estimatedGuests: 100,
    deliveryAddress: 'Av. Reforma 123, CDMX',
    specialInstructions: 'Vegetarian options required'
  })

  describe('Success Cases', () => {
    it('should create order successfully', async () => {
      const command = createValidCommand()

      const result = await handler.execute(command)

      expect(result.isSuccess()).toBe(true)
      const order = result.unwrap()
      expect(order.state).toBe('DRAFT')
      expect(order.deliveryAddress).toBe(command.deliveryAddress)
    })

    it('should persist order in repository', async () => {
      const command = createValidCommand()

      const result = await handler.execute(command)
      const order = result.unwrap()

      const found = await orderRepository.findById(order.orderId)
      
      expect(found.isSuccess()).toBe(true)
      expect(found.unwrap()).not.toBeNull()
      expect(found.unwrap()?.orderId.toString()).toBe(order.orderId.toString())
    })

    it('should publish OrderCreated event', async () => {
      const command = createValidCommand()

      await handler.execute(command)

      expect(eventPublisher.publishedEvents.length).toBe(1)
      expect(eventPublisher.publishedEvents[0].eventType).toBe('OrderCreated')
    })

    it('should create order without optional fields', async () => {
      const command: CreateOrderCommand = {
        clientId: 'client-123',
        eventDate: '2026-12-25T00:00:00.000Z',
        deliveryAddress: 'Test Address'
      }

      const result = await handler.execute(command)

      expect(result.isSuccess()).toBe(true)
      const order = result.unwrap()
      expect(order.props.eventType).toBeUndefined()
      expect(order.props.estimatedGuests).toBeUndefined()
    })

    it('should handle future event dates', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const command = {
        ...createValidCommand(),
        eventDate: futureDate.toISOString()
      }

      const result = await handler.execute(command)

      expect(result.isSuccess()).toBe(true)
    })
  })

  describe('Validation Failures', () => {
    it('should reject empty clientId', async () => {
      const command = {
        ...createValidCommand(),
        clientId: ''
      }

      const result = await handler.execute(command)

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('Client ID')
    })

    it('should reject empty eventDate', async () => {
      const command = {
        ...createValidCommand(),
        eventDate: ''
      }

      const result = await handler.execute(command)

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('date format')
    })

    it('should reject empty deliveryAddress', async () => {
      const command = {
        ...createValidCommand(),
        deliveryAddress: '   '
      }

      const result = await handler.execute(command)

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('Delivery address is required')
    })

    it('should reject invalid date format', async () => {
      const command = {
        ...createValidCommand(),
        eventDate: 'not-a-date'
      }

      const result = await handler.execute(command)

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('Invalid')
    })

    it('should reject negative estimatedGuests', async () => {
      const command = {
        ...createValidCommand(),
        estimatedGuests: -10
      }

      const result = await handler.execute(command)

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('positive')
    })

    it('should reject zero estimatedGuests', async () => {
      const command = {
        ...createValidCommand(),
        estimatedGuests: 0
      }

      const result = await handler.execute(command)

      expect(result.isFailure()).toBe(true)
    })
  })

  describe('Domain Rule Violations', () => {
    it('should reject past event date', async () => {
      const pastDate = new Date('2020-01-01')

      const command = {
        ...createValidCommand(),
        eventDate: pastDate.toISOString()
      }

      const result = await handler.execute(command)

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('future')
    })
  })

  describe('Repository Failures', () => {
    it('should handle repository save failure', async () => {
      // Force repository to fail
      orderRepository.shouldFail = true

      const command = createValidCommand()
      const result = await handler.execute(command)

      expect(result.isFailure()).toBe(true)
    })
  })

  describe('Event Publishing', () => {
    it('should continue even if event publishing fails', async () => {
      // Force event publisher to fail
      eventPublisher.shouldFail = true

      const command = createValidCommand()
      const result = await handler.execute(command)

      // Use case should still succeed
      expect(result.isSuccess()).toBe(true)
    })
  })
})
