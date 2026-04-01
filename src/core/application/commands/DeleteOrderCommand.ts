import { UserRole } from '@/core/domain/auth/UserRole';

/**
 * DeleteOrderCommand
 * 
 * Soft-delete de una orden
 */

export interface DeleteOrderCommand {
  orderId: string
  performedBy: string
  performedByRole: UserRole
  reason?: string
}
