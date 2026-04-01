// src/infrastructure/telemetry/DomainMetrics.ts

import { logger } from './StructuredLogger'

/**
 * DomainMetrics
 * 
 * Captura métricas de negocio para observabilidad estratégica.
 */
export const DomainMetrics = {
  recordAIBiasAnalysis(biasScore: number) {
    logger.info('📊 [Metrics] AI Bias Analysis Recorded', { biasScore })
  },

  recordQuoteApproved(amount: number, currency: string) {
    logger.info('📊 [Metrics] Quotation Approved', { amount, currency })
  },

  recordOrderCreated(orderId: string) {
    logger.info('📊 [Metrics] Order Created', { orderId })
  }
}
