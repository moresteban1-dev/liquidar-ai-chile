import { describe, it, expect } from 'vitest'
import { ServiceNode } from '@/core/domain/entities/event-intelligence/ServiceNode'

describe('ServiceNode', () => {
  it('should create a valid service node instance', () => {
    const props = {
      id: 'node-uuid',
      code: 'PROJECTOR',
      name: 'Proyector HD',
      description: 'Proyector para presentaciones',
      nodeType: 'EQUIPMENT' as const,
      isEssential: true,
      isActive: true
    }

    const result = ServiceNode.create(props)
    expect(result.isSuccess()).toBe(true)
    
    const node = result.getValue()
    expect(node.id).toBe(props.id)
    expect(node.code).toBe(props.code)
    expect(node.nodeType).toBe('EQUIPMENT')
    expect(node.isEssential).toBe(true)
  })

  it('should default isEssential to false', () => {
    const result = ServiceNode.create({
      id: '1',
      code: 'TABLE',
      name: 'Mesa',
      description: null,
      nodeType: 'EQUIPMENT',
      isEssential: undefined as any,
      isActive: true
    })

    expect(result.isSuccess()).toBe(true)
    expect(result.getValue().isEssential).toBe(false)
  })

  it('should throw error if code or name is missing', () => {
    const result = ServiceNode.create({
      id: '1',
      code: '',
      name: 'Test',
      description: null,
      nodeType: 'EQUIPMENT',
      isEssential: false,
      isActive: true
    })

    expect(result.isFailure()).toBe(true)
    expect(result.getError()).toBe('ServiceNode: code is required')
  })

  it('should serialize to JSON', () => {
    const result = ServiceNode.create({
      id: '1',
      code: 'WIFI',
      name: 'WiFi 6',
      description: 'Alta velocidad',
      nodeType: 'SERVICE',
      isEssential: false,
      isActive: true
    })

    expect(result.isSuccess()).toBe(true)
    const json = result.getValue().toJSON()
    expect(json.code).toBe('WIFI')
    expect(json.nodeType).toBe('SERVICE')
  })
})
