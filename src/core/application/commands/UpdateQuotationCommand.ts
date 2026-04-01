/**
 * UpdateQuotationCommand
 * 
 * Actualizar cotización (solo en DRAFT o SUBMITTED)
 */

export interface UpdateQuotationCommand {
  quotationId: string
  providerId: string
  updates: {
    providerCost?: number
    currency?: string
    commissionRate?: number
    serviceDescription?: string
    includes?: string[]
    excludes?: string[]
    estimatedDeliveryDays?: number
    providerNotes?: string
  }
}
