export type QuotationInternalStatus =
    | 'DRAFT'
    | 'PENDING_ASSIGNMENT'
    | 'PENDING_PROVIDER_BID'
    | 'PENDING_ADMIN_APPROVAL'
    | 'AWAITING_CLIENT_PAYMENT'
    | 'APPROVED'
    | 'PAID'
    | 'FULFILLED'
    | 'REJECTED'
    | 'CANCELLED';

export type QuotationPublicStatus =
    | 'PENDIENTE'
    | 'COTIZADA'
    | 'ACEPTADA'
    | 'REJECTED';
