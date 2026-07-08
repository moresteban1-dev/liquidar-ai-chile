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

