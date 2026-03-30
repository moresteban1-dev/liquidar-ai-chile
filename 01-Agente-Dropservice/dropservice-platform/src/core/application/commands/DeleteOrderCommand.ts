/**
 * DeleteOrderCommand
 * 
 * Soft-delete de una orden
 */

export interface DeleteOrderCommand {
  orderId: string
  performedBy: string
  performedByRole: 'admin' | 'client'
  reason?: string
}
