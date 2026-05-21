/**
 * Shared Type Definitions
 * Replaces Prisma Enums with String Unions + Const Objects
 * This allows both string literal usage and Dot-notation access.
 */

// ============================================
// USER ROLE
// ============================================
import { UserRole } from '@/core/domain/auth/UserRole';
export { UserRole };

// ============================================
// PUBLIC STATUS
// ============================================
export const QuotationPublicStatus = {
    SOLICITADA: 'SOLICITADA',
    RECIBIDA: 'RECIBIDA',
    EN_PROCESO: 'EN_PROCESO',
    EN_EVALUACION: 'EN_EVALUACION',
    EN_REVISION: 'EN_REVISION',
    COTIZADA: 'COTIZADA',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    EXPIRADA: 'EXPIRADA',
    PENDING_REVIEW: 'PENDING_REVIEW',
    PAID: 'PAID',
    IN_PRODUCTION: 'IN_PRODUCTION',
    EN_DESPACHO: 'EN_DESPACHO',
    DELIVERED: 'DELIVERED',
    FINALIZED: 'FINALIZED',
} as const;

export type QuotationPublicStatus = (typeof QuotationPublicStatus)[keyof typeof QuotationPublicStatus];

// ============================================
// INTERNAL STATUS
// ============================================
export const QuotationInternalStatus = {
    DRAFT: 'DRAFT',
    PENDING_ASSIGNMENT: 'PENDING_ASSIGNMENT',
    PENDING_PROVIDER_BID: 'PENDING_PROVIDER_BID',
    PENDING_ADMIN_APPROVAL: 'PENDING_ADMIN_APPROVAL',
    AWAITING_CLIENT_PAYMENT: 'AWAITING_CLIENT_PAYMENT',
    APPROVED: 'APPROVED',
    PAID: 'PAID',
    FULFILLED: 'FULFILLED',
    CANCELLED: 'CANCELLED',
    REJECTED: 'REJECTED',
} as const;

export type QuotationInternalStatus = (typeof QuotationInternalStatus)[keyof typeof QuotationInternalStatus];

// ============================================
// ORDER STATUS
// ============================================
export type OrderState =
    | 'DRAFT'
    | 'PENDING_PAYMENT'
    | 'PAYMENT_FAILED'
    | 'PAID'
    | 'ASSIGNED'
    | 'IN_PRODUCTION'
    | 'INTERNAL_REVIEW'
    | 'UNDER_REVIEW'
    | 'REVISION_REQUESTED'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'DISPUTED'
    | 'REFUNDED'
    | 'CANCELLED';

export const OrderStatus = {
    DRAFT: 'DRAFT',
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    PAID: 'PAID',
    ASSIGNED: 'ASSIGNED',
    IN_PRODUCTION: 'IN_PRODUCTION',
    INTERNAL_REVIEW: 'INTERNAL_REVIEW',
    UNDER_REVIEW: 'UNDER_REVIEW',
    REVISION_REQUESTED: 'REVISION_REQUESTED',
    DELIVERED: 'DELIVERED',
    COMPLETED: 'COMPLETED',
    DISPUTED: 'DISPUTED',
    REFUNDED: 'REFUNDED',
    CANCELLED: 'CANCELLED',
} as const;

export const ORDER_STATE_LABELS: Record<OrderState, string> = {
    DRAFT: 'Borrador',
    PENDING_PAYMENT: 'Pendiente de Pago',
    PAYMENT_FAILED: 'Pago Fallido',
    PAID: 'En Escrow / Pagada',
    ASSIGNED: 'Asignada a Proveedor',
    IN_PRODUCTION: 'En Producción',
    INTERNAL_REVIEW: 'Revisión Interna (QA)',
    UNDER_REVIEW: 'En Revisión (Cliente)',
    REVISION_REQUESTED: 'Revision Solicitada',
    DELIVERED: 'Entregada',
    COMPLETED: 'Completada',
    DISPUTED: 'En Disputa',
    REFUNDED: 'Reembolsada',
    CANCELLED: 'Cancelada'
};

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

// ============================================
// ENTITIES (Minimal for TS compatibility)
// ============================================

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
}

export interface Service {
    id: string;
    name: string;
    description: string;
    categoryId: string;
    priceFrom?: number | null;
    priceTo?: number | null;
}

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    role: UserRole | string;
    billing_rut?: string | null;
    billing_company_name?: string | null;
    billing_address?: string | null;
    providerProfiles?: {
        rating?: number;
        completed_orders?: number;
        specialty?: string;
        rut?: string | null;
        bank_name?: string | null;
        bank_account_type?: string | null;
        bank_account_number?: string | null;
    } | {
        rating?: number;
        completed_orders?: number;
        specialty?: string;
        rut?: string | null;
        bank_name?: string | null;
        bank_account_type?: string | null;
        bank_account_number?: string | null;
    }[] | null;
}

export interface QuotationItem {
    id: string;
    quantity: number;
    costUnit?: number | null;
    priceUnit?: number | null;
    serviceId: string;
    service?: Service;
}

export interface ProviderBid {
    id: string;
    providerId: string;
    quotationId: string;
    priceCost: number;
    deliveryDays: number;
    notes?: string;
    status: string;
    createdAt: string;
    provider?: UserProfile;
}

// ============================================
// QUOTATION FLOW V2 — Item Models
// ============================================

/** Items solicitados por el cliente (sin precios) */
export interface QuotationRequestedItem {
    id: string;
    quotationId: string;
    itemName: string;
    quantity: number;
    sortOrder: number;
}

/** Items cotizados por el proveedor (precio NETO) */
export interface QuotationProviderItem {
    id: string;
    quotationId: string;
    category: 'SERVICIO' | 'LOGISTICA';
    concept: string;
    quantity: number;
    unitPriceNet: number;
    totalPriceNet: number;
    sortOrder: number;
}

/** Items reformulados para el cliente (comisión incluida, NETO) */
export interface QuotationClientItem {
    id: string;
    quotationId: string;
    description: string;
    quantity: number;
    unitPriceNet: number;
    totalPriceNet: number;
    sortOrder: number;
}

/** Registro de auditoría de cambios de estado */
export interface QuotationHistoryEntry {
    id: string;
    quotationId: string;
    previousStatus: string | null;
    newStatus: string;
    actorId: string;
    actorType: 'ADMIN' | 'SYSTEM' | UserRole | string;
    comment?: string | null;
    ipAddress?: string | null;
    createdAt: string;
}

/** Método de comisión del administrador */
export type CommissionMethod = 'MONTO_FIJO' | 'PORCENTAJE' | 'PORCENTAJE_CATEGORIA' | 'MIXTO';

// ============================================
// QUOTATION ENTITY
// ============================================

export interface QuotationDTO {
    id: string;
    code: string;
    clientId: string;
    client?: UserProfile;
    assignedProviderId?: string | null;
    provider?: UserProfile;
    serviceId?: string | null;
    service?: Service;
    brief: string;

    // Status
    publicStatus: QuotationPublicStatus;
    status: QuotationInternalStatus;

    // Client Data
    clientRut?: string | null;

    // Dates
    createdAt: string | Date;
    updatedAt: string | Date;
    validUntil?: string | Date | null;

    // Event Details
    eventStartDate?: string | Date | null;
    eventEndDate?: string | Date | null;
    eventLocation?: string | null;
    eventAddress?: string | null;
    eventTime?: string | null;
    setupTime?: string | null;
    teardownTime?: string | null;
    eventEndTime?: string | null;
    technicalVisit?: boolean;

    // Legacy Pricing (single markup)
    priceCost?: number | null;
    priceNet?: number | null;
    priceIva?: number | null;
    priceTotal?: number | null;
    adminFee?: number | null;
    markupPercentage?: number | null;
    markupAmount?: number | null;

    // V2 Pricing — Commission Model
    subtotalServicesProvider?: number | null;
    subtotalLogisticsProvider?: number | null;
    totalProviderNet?: number | null;
    commissionServicesNet?: number | null;
    commissionLogisticsNet?: number | null;
    totalCommissionNet?: number | null;
    commissionMethod?: CommissionMethod | null;
    totalNet?: number | null;
    totalIva?: number | null;
    totalWithIva?: number | null;

    // Notes
    internalNotes?: string | null;
    providerNotes?: string | null;
    rejectionReason?: string | null;

    // Phase Timestamps
    assignedAt?: string | Date | null;
    providerQuotedAt?: string | Date | null;
    sentToClientAt?: string | Date | null;
    approvedAt?: string | Date | null;
    rejectedAt?: string | Date | null;
    paidAt?: string | Date | null;
    confirmedAt?: string | Date | null;
    fulfilledAt?: string | Date | null;
    issuedAt?: string | Date | null;

    // Relations
    quotationItems?: QuotationItem[];
    quotation_items?: QuotationItem[];
    providerBids?: ProviderBid[];
    provider_bids?: ProviderBid[];
    requestedItems?: QuotationRequestedItem[];
    providerItems?: QuotationProviderItem[];
    clientItems?: QuotationClientItem[];
    history?: QuotationHistoryEntry[];
    orders?: { id: string }[];
}

