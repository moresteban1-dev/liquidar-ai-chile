/**
 * AssignProviderToOrderCommand
 * 
 * Command para asignar un proveedor a una orden
 */

export interface AssignProviderToOrderCommand {
  orderId: string
  providerId: string
}
