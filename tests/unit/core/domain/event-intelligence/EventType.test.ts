import { describe, it, expect } from 'vitest'
import { EventType } from '@/core/domain/aggregates/event-intelligence/EventType'

describe('EventType', () => {
  it('should create a valid event type instance', () => {
    const props = {
      id: 'test-uuid',
      code: 'CORP_WORKSHOP',
      name: 'Workshop Corporativo',
      description: 'Un taller para empresas',
      baseCategory: 'CORPORATE',
      isActive: true
    }

    const result = EventType.create(props)
    expect(result.isSuccess()).toBe(true)
    const eventType = result.getValue()

    expect(eventType.id).toBe(props.id)
    expect(eventType.code).toBe(props.code)
    expect(eventType.name).toBe(props.name)
    expect(eventType.baseCategory).toBe(props.baseCategory)
    expect(eventType.isActive).toBe(true)
  })

  it('should throw error if code is empty', () => {
    const result = EventType.create({
      id: '1',
      code: '',
      name: 'Test',
      description: null,
      baseCategory: 'SOCIAL',
      isActive: true
    })
    expect(result.isFailure()).toBe(true)
    expect(result.getError()).toBe('EventType: code is required')
  })

  it('should throw error if name is empty', () => {
    const result = EventType.create({
      id: '1',
      code: 'TEST',
      name: ' ',
      description: null,
      baseCategory: 'SOCIAL',
      isActive: true
    })
    expect(result.isFailure()).toBe(true)
    expect(result.getError()).toBe('EventType: name is required')
  })

  it('should reconstitute from existing props', () => {
    const props = {
      id: 'existing-id',
      code: 'WEDDING',
      name: 'Boda',
      description: 'Boda estándar',
      baseCategory: 'SOCIAL',
      isActive: false
    }

    const eventType = EventType.reconstitute(props)
    expect(eventType.isActive).toBe(false)
    expect(eventType.code).toBe('WEDDING')
  })

  it('should serialize to JSON correctly', () => {
    const result = EventType.create({
      id: '1',
      code: 'TEST',
      name: 'Test',
      description: 'Desc',
      baseCategory: 'SOCIAL',
      isActive: true
    })

    expect(result.isSuccess()).toBe(true)
    const json = result.getValue().toJSON()
    expect(json.code).toBe('TEST')
    expect(json.name).toBe('Test')
    expect(json.isActive).toBe(true)
  })
})
