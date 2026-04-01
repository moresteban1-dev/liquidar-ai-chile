import { UserRole } from '@/core/domain/auth/UserRole';

/**
 * TransitionOrderStateCommand
 * 
 * Comando para cambiar el estado de una orden.
 * Contiene toda la metadata necesaria para la auditoría y validación de reglas de negocio.
 */
export interface TransitionOrderStateCommand {
  orderId: string
  newState: string
  reason?: string       // Requerido para transiciones a CANCELLED
  performedBy: string   // ID del usuario que ejecuta la acción
  performedByRole: UserRole
}
