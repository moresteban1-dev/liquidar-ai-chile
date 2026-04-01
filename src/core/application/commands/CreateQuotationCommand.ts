import { ICommand } from '@core/shared/ICommand'

/**
 * CreateQuotationCommand
 * 
 * Proveedor crea cotización para una orden asignada
 */
export interface CreateQuotationCommand extends ICommand {
  commandName: 'CreateQuotation'
  orderId: string
  providerId: string
  providerCost: number
  currency: string
  commissionRate: number
  serviceDescription: string
  includes: string[]
  excludes: string[]
  validDays: number
  estimatedDeliveryDays: number
  providerNotes?: string
}
