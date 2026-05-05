// src/infrastructure/telemetry/MetricsService.ts

import { logger } from './StructuredLogger'

/**
 * MetricsService
 * 
 * Sistema de métricas unificado compatible con la arquitectura NASA-Grade.
 */
export const metrics = {
  increment(name: string, value: number = 1, tags: Record<string, string> = {}) {
    logger.info(`📈 [Metrics:Increment] ${name}`, { value, ...tags })
  },

  record(name: string, value: number, tags: Record<string, string> = {}) {
    logger.info(`📈 [Metrics:Record] ${name}`, { value, ...tags })
  },

  recordRequest(method: string, path: string, duration: number) {
    this.record('tech.http.latency', duration, { method, path })
    this.increment('tech.http.requests', 1, { method, path })
  },

  recordError(error: Error, context?: string) {
    logger.error(`📈 [Error Metrics] ${context || 'General Error'}`, error)
  }
}

