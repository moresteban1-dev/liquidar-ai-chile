import { describe, it, expect } from 'vitest';
import { ServiceNode } from './ServiceNode';

describe('ServiceNode', () => {
  const validProps = {
    id: 'node_123',
    code: 'PROJ_BARCO',
    name: 'Proyector Barco 10k',
    description: 'High brightness projector',
    nodeType: 'EQUIPMENT' as const,
    isEssential: true,
    isActive: true
  };

  it('should create a valid ServiceNode', () => {
    const node = ServiceNode.create(validProps);
    expect(node.id).toBe(validProps.id);
    expect(node.nodeType).toBe('EQUIPMENT');
    expect(node.isEssential).toBe(true);
  });

  it('should throw error if code is empty', () => {
    expect(() => ServiceNode.create({ ...validProps, code: '' })).toThrow('ServiceNode: code is required');
  });

  it('should throw error if name is empty', () => {
    expect(() => ServiceNode.create({ ...validProps, name: ' ' })).toThrow('ServiceNode: name is required');
  });

  it('should reconstitute a ServiceNode', () => {
    const node = ServiceNode.reconstitute(validProps);
    expect(node.toJSON()).toEqual(validProps);
  });
});
