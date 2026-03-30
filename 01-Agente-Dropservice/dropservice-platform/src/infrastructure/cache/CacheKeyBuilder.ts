/**
 * Deterministic cache key generation.
 * Ensures same inputs always produce same key.
 * Prevents key collisions between different query types.
 */

export class CacheKeyBuilder {
  private parts: string[];

  private constructor(namespace: string) {
    this.parts = [namespace];
  }

  /**
   * Start building a key with a namespace.
   * Example: CacheKeyBuilder.for('orders')
   */
  static for(namespace: string): CacheKeyBuilder {
    return new CacheKeyBuilder(namespace);
  }

  /**
   * Add an entity identifier.
   * Example: .entity('client', 'user-123')
   */
  entity(type: string, id: string): CacheKeyBuilder {
    this.parts.push(`${type}:${id}`);
    return this;
  }

  /**
   * Add a query/action type.
   * Example: .action('list')
   */
  action(name: string): CacheKeyBuilder {
    this.parts.push(name);
    return this;
  }

  /**
   * Add sorted params to ensure deterministic keys.
   * Example: .params({ page: 1, limit: 20, status: 'active' })
   */
  params(obj: Record<string, string | number | boolean | undefined | null>): CacheKeyBuilder {
    const filtered: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null && value !== '') {
        filtered[key] = String(value);
      }
    }

    // Sort keys for determinism
    const sorted = Object.keys(filtered)
      .sort()
      .map((k) => `${k}=${filtered[k]}`)
      .join('&');

    if (sorted) {
      this.parts.push(sorted);
    }

    return this;
  }

  /**
   * Add a version/segment identifier.
   */
  version(v: string | number): CacheKeyBuilder {
    this.parts.push(`v${v}`);
    return this;
  }

  /**
   * Build the final cache key string.
   */
  build(): string {
    return this.parts.join(':');
  }

  /**
   * Build key and return associated tags for invalidation.
   */
  buildWithTags(): { key: string; tags: string[] } {
    const key = this.build();
    // Tags are the first 2 parts (namespace + entity)
    const tags = this.parts.slice(0, Math.min(this.parts.length, 3));
    return { key, tags };
  }
}

// ═══════════════════════════════════════════════════════════
// Pre-built Key Patterns
// ═══════════════════════════════════════════════════════════

export const CacheKeys = {
  orderList: (
    role: string,
    userId: string,
    params: Record<string, string | number | boolean | undefined>,
  ) =>
    CacheKeyBuilder.for('orders')
      .entity(role, userId)
      .action('list')
      .params(params as any)
      .build(),

  orderDetail: (orderId: string) =>
    CacheKeyBuilder.for('orders')
      .entity('order', orderId)
      .action('detail')
      .build(),

  orderDetailEnriched: (orderId: string) =>
    CacheKeyBuilder.for('orders')
      .entity('order', orderId)
      .action('detail-enriched')
      .build(),

  dashboardStats: () =>
    CacheKeyBuilder.for('dashboard')
      .action('stats')
      .build(),

  quotationsByOrder: (orderId: string) =>
    CacheKeyBuilder.for('quotations')
      .entity('order', orderId)
      .action('list')
      .build(),

  providerProfile: (providerId: string) =>
    CacheKeyBuilder.for('profiles')
      .entity('provider', providerId)
      .action('profile')
      .build(),

  userProfile: (userId: string) =>
    CacheKeyBuilder.for('profiles')
      .entity('user', userId)
      .action('profile')
      .build(),

  notificationStats: (hours: number) =>
    CacheKeyBuilder.for('notifications')
      .action('stats')
      .params({ hours })
      .build(),
};

// ═══════════════════════════════════════════════════════════
// Invalidation Patterns (what to clear after writes)
// ═══════════════════════════════════════════════════════════

export const InvalidationPatterns = {
  /** After creating/updating an order */
  orderChanged: (orderId: string, clientId: string, providerId?: string) => [
    `orders:order:${orderId}`,     // Detail cache
    `orders:client:${clientId}`,   // Client's order lists
    `dashboard`,                    // Dashboard stats
    ...(providerId ? [`orders:provider:${providerId}`] : []),
  ],

  /** After creating/updating a quotation */
  quotationChanged: (orderId: string, providerId: string) => [
    `quotations:order:${orderId}`, // Quotations for this order
    `orders:order:${orderId}`,     // Order detail (includes quotations)
    `dashboard`,                    // Revenue/profit stats
    `orders:provider:${providerId}`,
  ],

  /** After user profile update */
  profileChanged: (userId: string) => [
    `profiles:user:${userId}`,
    `profiles:provider:${userId}`,
  ],
};
