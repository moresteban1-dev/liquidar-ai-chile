import { describe, it, expect } from 'vitest'
import { withSpan } from './tracer'

describe('Tracer', () => {
  it('should execute function within span', async () => {
    const result = await withSpan(
      'test-span',
      { 'test.key': 'test-value' },
      async (span) => {
        expect(span).toBeDefined()
        return 42
      }
    )

    expect(result).toBe(42)
  })

  it('should propagate errors from span', async () => {
    await expect(
      withSpan('error-span', {}, async () => {
        throw new Error('Test error')
      })
    ).rejects.toThrow('Test error')
  })
})
