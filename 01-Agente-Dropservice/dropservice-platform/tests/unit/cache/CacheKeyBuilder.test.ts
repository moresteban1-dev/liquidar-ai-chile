import { CacheKeyBuilder, CacheKeys } from '@/infrastructure/cache/CacheKeyBuilder';

describe('CacheKeyBuilder', () => {
  it('should build simple keys', () => {
    const key = CacheKeyBuilder.for('orders').entity('client', '123').build();
    expect(key).toBe('orders:client:123');
  });

  it('should build keys with actions', () => {
    const key = CacheKeyBuilder.for('orders').entity('client', '123').action('list').build();
    expect(key).toBe('orders:client:123:list');
  });

  it('should be deterministic with params', () => {
    const params1 = { page: 1, status: 'active', limit: 10 };
    const params2 = { limit: 10, page: 1, status: 'active' };

    const key1 = CacheKeyBuilder.for('orders').params(params1).build();
    const key2 = CacheKeyBuilder.for('orders').params(params2).build();

    expect(key1).toBe(key2);
    expect(key1).toContain('limit=10&page=1&status=active');
  });

  it('should ignore empty/null params', () => {
    const key = CacheKeyBuilder.for('test').params({ a: 1, b: null, c: undefined, d: '' }).build();
    expect(key).toBe('test:a=1');
  });

  it('should generate tags correctly', () => {
    const { key, tags } = CacheKeyBuilder.for('orders').entity('client', '123').action('list').buildWithTags();
    expect(key).toBe('orders:client:123:list');
    expect(tags).toContain('orders');
    expect(tags).toContain('client:123');
    expect(tags).toContain('list');
  });
});

describe('CacheKeys Presets', () => {
  it('should generate consistent orderList key', () => {
    const key = CacheKeys.orderList('client', 'c1', { page: 1 });
    expect(key).toBe('orders:client:c1:list:page=1');
  });

  it('should generate consistent orderDetail key', () => {
    const key = CacheKeys.orderDetail('o1');
    expect(key).toBe('orders:order:o1:detail');
  });
});
