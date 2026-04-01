import { z } from 'zod';
import { commonSchemas } from './zod-helper';

// Quotation Input Schemas
export const createQuotationSchema = z.object({
    clientId: commonSchemas.uuid,
    serviceId: commonSchemas.uuid,
    description: z.string().trim().min(1, 'Required field').max(2000).transform(val => val), // Simplified to avoid pipe error
});

export const updateQuotationSchema = z.object({
    id: commonSchemas.uuid,
    priceTotal: z.number().positive().optional(),
    providerCost: z.number().positive().optional(),
    deliveryDays: z.number().int().positive().optional(),
});

// Domain Types derived from Schemas
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
