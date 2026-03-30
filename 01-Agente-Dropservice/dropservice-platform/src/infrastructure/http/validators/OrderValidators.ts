import { z } from 'zod'

/**
 * Zod schemas para validación de requests
 */

export const CreateOrderSchema = z.object({
  clientId: z.string().uuid('Invalid client ID format'),
  eventDate: z.string().datetime('Invalid date format'),
  eventType: z.string().optional(),
  estimatedGuests: z.number().int().positive().optional(),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  specialInstructions: z.string().optional()
})

export const AssignProviderSchema = z.object({
  providerId: z.string().uuid('Invalid provider ID format')
})

export const UpdateOrderStateSchema = z.object({
  newState: z.enum([
    'DRAFT',
    'QUOTATION_PENDING',
    'QUOTATION_SENT',
    'QUOTATION_APPROVED',
    'PAYMENT_PENDING',
    'PAYMENT_RECEIVED',
    'IN_PRODUCTION',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED'
  ]),
  reason: z.string().optional()
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type AssignProviderInput = z.infer<typeof AssignProviderSchema>
export type UpdateOrderStateInput = z.infer<typeof UpdateOrderStateSchema>
