import { describe, it, expect, beforeEach } from 'vitest'
import { InstrumentedHandler } from './InstrumentedHandler'
import { Result, Success, Failure } from '@/core/shared/Result'

class TestHandler extends InstrumentedHandler<{ value: number }, number> {
  protected handlerName = 'TestHandler'
  protected operationType = 'command' as const
  public shouldFail = false
  public shouldThrow = false

  protected async handle(command: { value: number }): Promise<Result<number, string>> {
    if (this.shouldThrow) throw new Error('Unexpected error')
    if (this.shouldFail) return new Failure('Business rule violated')
    return new Success(command.value * 2)
  }

  protected extractSpanAttributes(command: { value: number }) {
    return { 'test.value': command.value }
  }
}

describe('InstrumentedHandler', () => {
  let handler: TestHandler
  beforeEach(() => { handler = new TestHandler() })

  it('should execute successfully', async () => {
    const result = await handler.execute({ value: 21 })
    expect(result.isSuccess()).toBe(true)
    expect(result.unwrap()).toBe(42)
  })

  it('should handle business failures', async () => {
    handler.shouldFail = true
    const result = await handler.execute({ value: 21 })
    expect(result.isFailure()).toBe(true)
    expect(result.error).toBe('Business rule violated')
  })

  it('should propagate exceptions', async () => {
    handler.shouldThrow = true
    await expect(handler.execute({ value: 21 })).rejects.toThrow('Unexpected error')
  })
})
