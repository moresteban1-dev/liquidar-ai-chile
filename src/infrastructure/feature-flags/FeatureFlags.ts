/**
 * Feature Flag System
 * 
 * Controla rollout gradual de nuevos endpoints
 * 
 * Strategies:
 * - environment: Basado en NODE_ENV
 * - percentage: Basado en % de tráfico
 * - user: Basado en userId (whitelist)
 * - header: Basado en header custom (para testing)
 */

export type FlagStrategy = 'environment' | 'percentage' | 'user' | 'header'

export interface FeatureFlagConfig {
  name: string
  description: string
  enabled: boolean
  strategy: FlagStrategy
  percentage?: number          // 0-100 para strategy 'percentage'
  allowedUsers?: string[]      // Para strategy 'user'
  headerName?: string          // Para strategy 'header'
  headerValue?: string
  environments?: string[]      // Para strategy 'environment'
}

const FLAGS: Record<string, FeatureFlagConfig> = {
  'v2-orders-create': {
    name: 'v2-orders-create',
    description: 'Use v2 architecture for POST /api/orders',
    enabled: true,
    strategy: 'percentage',
    percentage: 10             // 10% de tráfico inicial
  },
  'v2-orders-get': {
    name: 'v2-orders-get',
    description: 'Use v2 architecture for GET /api/orders/:id',
    enabled: true,
    strategy: 'percentage',
    percentage: 10
  },
  'v2-quotations': {
    name: 'v2-quotations',
    description: 'Use v2 architecture for all quotation endpoints',
    enabled: true,
    strategy: 'percentage',
    percentage: 0              // No habilitado aún
  },
  'v2-full': {
    name: 'v2-full',
    description: 'Use v2 architecture for ALL endpoints',
    enabled: false,
    strategy: 'percentage',
    percentage: 0
  }
}

export class FeatureFlags {
  private flags: Record<string, FeatureFlagConfig>

  constructor(overrides?: Record<string, Partial<FeatureFlagConfig>>) {
    // Copiar flags base
    this.flags = JSON.parse(JSON.stringify(FLAGS))

    // Aplicar overrides de environment variables
    this.applyEnvironmentOverrides()

    // Aplicar overrides manuales
    if (overrides) {
      for (const [name, override] of Object.entries(overrides)) {
        if (this.flags[name]) {
          this.flags[name] = { ...this.flags[name], ...override }
        }
      }
    }
  }

  /**
   * Verifica si un feature flag está habilitado para un request
   */
  public isEnabled(
    flagName: string,
    context?: {
      userId?: string
      headers?: Headers
      environment?: string
    }
  ): boolean {
    const flag = this.flags[flagName]

    if (!flag) {
      return false
    }

    if (!flag.enabled) {
      return false
    }

    switch (flag.strategy) {
      case 'environment':
        return this.checkEnvironment(flag, context?.environment)

      case 'percentage':
        return this.checkPercentage(flag, context?.userId)

      case 'user':
        return this.checkUser(flag, context?.userId)

      case 'header':
        return this.checkHeader(flag, context?.headers)

      default:
        return false
    }
  }

  /**
   * Obtiene configuración actual de un flag
   */
  public getFlag(name: string): FeatureFlagConfig | undefined {
    return this.flags[name]
  }

  /**
   * Lista todos los flags
   */
  public getAllFlags(): FeatureFlagConfig[] {
    return Object.values(this.flags)
  }

  /**
   * Actualiza porcentaje de un flag (para rollout gradual)
   */
  public setPercentage(flagName: string, percentage: number): void {
    if (this.flags[flagName]) {
      this.flags[flagName].percentage = Math.max(0, Math.min(100, percentage))
    }
  }

  // Strategy implementations
  private checkEnvironment(
    flag: FeatureFlagConfig,
    environment?: string
  ): boolean {
    const env = environment || process.env['NODE_ENV'] || 'development'
    return flag.environments?.includes(env) ?? false
  }

  private checkPercentage(
    flag: FeatureFlagConfig,
    userId?: string
  ): boolean {
    const percentage = flag.percentage ?? 0

    if (percentage >= 100) return true
    if (percentage <= 0) return false

    // Deterministic hash basado en userId para consistencia
    if (userId) {
      const hash = this.simpleHash(userId + flag.name)
      return (hash % 100) < percentage
    }

    // Random si no hay userId
    return Math.random() * 100 < percentage
  }

  private checkUser(
    flag: FeatureFlagConfig,
    userId?: string
  ): boolean {
    if (!userId || !flag.allowedUsers) {
      return false
    }

    return flag.allowedUsers.includes(userId)
  }

  private checkHeader(
    flag: FeatureFlagConfig,
    headers?: Headers
  ): boolean {
    if (!headers || !flag.headerName) {
      return false
    }

    const headerValue = headers.get(flag.headerName)

    if (flag.headerValue) {
      return headerValue === flag.headerValue
    }

    return headerValue === 'true' || headerValue === '1'
  }

  /**
   * Simple deterministic hash para percentage-based flags
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Lee overrides desde environment variables
   * 
   * Format: FEATURE_FLAG_<NAME>=<percentage>
   * Example: FEATURE_FLAG_V2_ORDERS_CREATE=50
   */
  private applyEnvironmentOverrides(): void {
    for (const [name, flag] of Object.entries(this.flags)) {
      const envKey = `FEATURE_FLAG_${name.toUpperCase().replace(/-/g, '_')}`
      const envValue = process.env[envKey]

      if (envValue !== undefined) {
        const percentage = parseInt(envValue, 10)
        if (!isNaN(percentage)) {
          flag.percentage = Math.max(0, Math.min(100, percentage))
          flag.enabled = percentage > 0
        }
      }
    }
  }
}

// Singleton instance
export const featureFlags = new FeatureFlags()
