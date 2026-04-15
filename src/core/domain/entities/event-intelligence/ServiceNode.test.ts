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
    const result = ServiceNode.create(validProps);
    expect(result.isSuccess()).toBe(true);
    const node = result.getValue();
    expect(node.id).toBe(validProps.id);
    expect(node.nodeType).toBe('EQUIPMENT');
    expect(node.isEssential).toBe(true);
  });

  it('should fail if code is empty', () => {
    const result = ServiceNode.create({ ...validProps, code: '' });
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toContain('code is required');
  });

  it('should fail if name is empty', () => {
    const result = ServiceNode.create({ ...validProps, name: ' ' });
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toContain('name is required');
  });

  it('should reconstitute a ServiceNode', () => {
    const node = ServiceNode.reconstitute(validProps);
    expect(node.toJSON()).toEqual(validProps);
  });
});
