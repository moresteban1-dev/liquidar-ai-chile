/**
 * API Zod Schemas 
 * Centralized validation schemas for all API route request bodies.
 * Used with validateRequestBody() from @/lib/validators/api-validator.
 */

import { z } from 'zod';
import { UserRole } from '@/core/domain/auth/UserRole';

// ─── Shared ─────────────────────────────────────────────────────────────────

const uuidSchema = z.string().uuid();

// ─── Quotations ─────────────────────────────────────────────────────────────

export const CreateQuotationSchema = z.object({
    clientName: z.string().max(100).optional().default(''),
    clientEmail: z.string().email().max(254),
    clientPhone: z.string().max(20).optional().default(''),
    brief: z.string().min(1).max(2000),
    serviceId: z.string().optional(),
    categoryId: z.string().optional(),
    requirements: z.unknown().optional(),
    items: z.array(z.object({
        serviceId: z.string(),
        quantity: z.number().int().positive().optional().default(1),
    })).optional().default([]),
    eventStartDate: z.string().nullable().optional(),
    eventEndDate: z.string().nullable().optional(),
    venueAddress: z.string().max(200).optional(),
    eventLocation: z.string().max(200).optional(),
    eventStartTime: z.string().max(50).optional(),
    eventEndTime: z.string().max(50).optional(),
    eventTime: z.string().max(50).optional(),
    mountingTime: z.string().max(100).optional(),
    dismountingTime: z.string().max(100).optional(),
    setupTime: z.string().max(100).optional(),
    teardownTime: z.string().max(100).optional(),
    needsTechnicalVisit: z.boolean().optional().default(false),
});

export const TransitionQuotationSchema = z.object({
    toStatus: z.string().min(1),
    assignedProviderId: z.string().uuid().optional(),
}).passthrough(); // Allow extra fields for transition data

export const ApplyMarkupSchema = z.object({
    selectedBidId: z.string().uuid(),
    markupPercentage: z.number().min(0).max(500).optional().default(50),
});

export const SubmitBidSchema = z.object({
    priceCost: z.number().positive(),
    deliveryDays: z.number().int().positive(),
    notes: z.string().max(1000).optional(),
});

export const CommissionSchema = z.object({
    commissionMethod: z.enum(['MONTO_FIJO', 'PORCENTAJE', 'PORCENTAJE_CATEGORIA', 'MIXTO']),
    globalPercentage: z.number().min(0).max(100).optional(),
    servicesPercentage: z.number().min(0).max(100).optional(),
    logisticsPercentage: z.number().min(0).max(100).optional(),
    fixedCommissionServices: z.number().min(0).optional(),
    fixedCommissionLogistics: z.number().min(0).optional(),
    clientItems: z.array(z.object({
        description: z.string().min(1).max(500),
        quantity: z.number().int().positive().optional().default(1),
        unitPriceNet: z.number().min(0),
    })).min(1),
    validDays: z.number().int().positive().optional().default(7),
});

export const ProviderQuoteSchema = z.object({
    items: z.array(z.object({
        description: z.string().min(1),
        quantity: z.number().int().positive(),
        unitCost: z.number().min(0),
        category: z.enum(['SERVICE', 'LOGISTICS']).optional().default('SERVICE'),
    })).min(1),
    notes: z.string().max(2000).optional(),
    deliveryDays: z.number().int().positive().optional(),
});

// ─── Payments ───────────────────────────────────────────────────────────────

export const CreatePaymentSchema = z.object({
    order_id: z.string().uuid(),
    gateway_slug: z.string().min(1).max(50),
    amount: z.number().positive(),
    currency: z.string().min(3).max(3).optional().default('CLP'),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const CreatePreferenceSchema = z.object({
    quotationId: uuidSchema,
    gateway: z.string().min(1),
});

export const ManualPaymentConfirmSchema = z.object({
    paymentId: uuidSchema,
    transferNumber: z.string().min(1).max(100).optional(),
    notes: z.string().max(500).optional(),
});

// ─── Orders ─────────────────────────────────────────────────────────────────

export const CreateOrderSchema = z.object({
    quotationId: z.string().uuid().optional(),
    clientId: z.string().uuid(),
    serviceId: z.string().uuid().optional(),
    priceCost: z.number().positive(),
    markupPercentage: z.number().min(0).max(500).optional().default(50),
});

export const TransitionOrderSchema = z.object({
    toStatus: z.string().min(1),
}).passthrough();

// ─── Admin ──────────────────────────────────────────────────────────────────

export const AdminProposalSchema = z.object({
    quotationId: uuidSchema,
    providerId: uuidSchema,
    items: z.array(z.object({
        catalogItemId: z.string().uuid().optional(),
        description: z.string().min(1),
        quantity: z.number().int().positive(),
        unitCost: z.number().min(0),
    })).min(1),
});

export const PaymentGatewayUpdateSchema = z.object({
    slug: z.string().min(1),
    is_active: z.boolean().optional(),
    commission_percent: z.number().min(0).max(100).optional(),
    commission_fixed: z.number().min(0).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
});

// ─── Auth ───────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
    email: z.string().email().max(254),
    password: z.string().min(8).max(128),
    name: z.string().min(1).max(100),
    role: z.nativeEnum(UserRole).optional().default(UserRole.CLIENT),
    phone: z.string().max(20).optional(),
});

// ─── Config ─────────────────────────────────────────────────────────────────

export const ConfigUpdateSchema = z.object({
    key: z.string().min(1),
    value: z.unknown(),
});

// ─── Notifications ──────────────────────────────────────────────────────────

export const MarkNotificationReadSchema = z.object({
    notificationId: z.string().uuid().optional(),
    markAll: z.boolean().optional(),
});

// ─── Forensics ──────────────────────────────────────────────────────────────

export const ForensicReportSchema = z.object({
    digest: z.string().min(1),
    error: z.string().optional(),
    stack: z.string().optional(),
    url: z.string().optional(),
    componentStack: z.string().optional(),
});
