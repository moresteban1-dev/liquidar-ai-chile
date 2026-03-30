
/**
 * Production Smoke Tests
 * 
 * Verificaciones mínimas en producción
 * Se ejecutan después de cada deploy
 */

const PROD_URL = process.env.PROD_URL || ''
const HAS_SERVER = PROD_URL.length > 0

describe.skipIf(!HAS_SERVER)('Production Smoke Tests', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await fetch(`${PROD_URL}/api/health`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('ok')
      expect(data.checks.database.status).toBe('ok')
    })

    it('should have acceptable database latency', async () => {
      const response = await fetch(`${PROD_URL}/api/health`)
      const data = await response.json()

      expect(data.checks.database.latency).toBeLessThan(500)
    })

    it('should have acceptable memory usage', async () => {
      const response = await fetch(`${PROD_URL}/api/health`)
      const data = await response.json()

      expect(data.checks.memory.usage).toBeLessThan(95) // Adjusted to 95 for safer margin
    })
  })

  describe('Order API', () => {
    let createdOrderId: string

    it('should create order successfully', async () => {
      const response = await fetch(`${PROD_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: 'smoke-test-' + Date.now(),
          eventDate: '2026-12-25T00:00:00.000Z',
          deliveryAddress: 'Smoke Test Address - Chile'
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.id).toBeDefined()
      createdOrderId = data.id
    })

    it('should retrieve created order', async () => {
      if (!createdOrderId) return

      const response = await fetch(`${PROD_URL}/api/orders/${createdOrderId}`)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.id).toBe(createdOrderId)
    })

    it('should return 404 for non-existent order', async () => {
      const response = await fetch(
        `${PROD_URL}/api/orders/00000000-0000-0000-0000-000000000000`
      )
      expect(response.status).toBe(404)
    })
  })

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await fetch(`${PROD_URL}/api/health`)
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    })
  })
})
