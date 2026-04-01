/**
 * AttachQuotationToOrderCommand
 * 
 * Command para adjuntar una cotización a una orden
 */

export interface AttachQuotationToOrderCommand {
  orderId: string
  quotationId: string
  providerCost: number
  currency: string
  commissionRate: number
}
