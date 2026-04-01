import { ICommand } from '@core/shared/ICommand'

/**
 * SubmitQuotationCommand
 * 
 * Proveedor envía cotización al admin para revisión
 */
export interface SubmitQuotationCommand extends ICommand {
  commandName: 'SubmitQuotation'
  quotationId: string
  providerId: string
}
