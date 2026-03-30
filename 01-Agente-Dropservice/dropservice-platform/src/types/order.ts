/**
 * Order State Machine Types
 * Kaizen Poka-Yoke: Make invalid states unrepresentable via TypeScript
 */

// ============================================
// ORDER STATES (Finite State Machine)
// ============================================

export type OrderState =
    | 'DRAFT'
    | 'PENDING_PAYMENT'
    | 'PAYMENT_FAILED'
    | 'PAID' // acts as "in_escrow"
    | 'ASSIGNED'
    | 'IN_PRODUCTION'
    | 'INTERNAL_REVIEW' // Admin/QA Review
    | 'UNDER_REVIEW'
    | 'REVISION_REQUESTED' // revision_requested
    | 'DELIVERED' // acts as completed (Delivered)
    | 'COMPLETED' // Funds Released / Closed
    | 'DISPUTED'
    | 'REFUNDED'
    | 'CANCELLED';

// ============================================
// ORDER EVENTS (Valid Transitions)
// ============================================

export type OrderEvent =
    | { type: 'SUBMIT'; briefId: string }
    | { type: 'PAYMENT_CAPTURED'; paymentIntentId: string }
    | { type: 'PAYMENT_FAILED'; reason: string }
    | { type: 'ASSIGN_VENDOR'; vendorId: string }
    | { type: 'VENDOR_STARTED' }
    | { type: 'DELIVERABLE_SUBMITTED'; deliverableUrl: string }
    | { type: 'CLIENT_APPROVED'; signature: string }
    | { type: 'CLIENT_REJECTED'; feedback: string }
    | { type: 'REVISION_COMPLETED'; deliverableUrl: string }
    | { type: 'DISPUTE_OPENED'; reason: string }
    | { type: 'DISPUTE_RESOLVED_CLIENT' }
    | { type: 'DISPUTE_RESOLVED_VENDOR' }
    | { type: 'SLA_EXCEEDED' }
    | { type: 'ADMIN_APPROVED' } // Admin approves internal review
    | { type: 'ADMIN_REJECTED'; reason: string } // Admin sends back to vendor
    | { type: 'FUNDS_RELEASED' } // Admin/System releases funds to vendor
    | { type: 'CANCEL'; reason: string };

// ============================================
// DISCRIMINATED UNION: Order by State
// Poka-Yoke: Each state has ONLY valid properties
// ============================================

export type Order =
    | {
        state: 'DRAFT';
        id: string;
        clientId: string;
        briefId: string | null;
        createdAt: Date;
    }
    | {
        state: 'PENDING_PAYMENT';
        id: string;
        clientId: string;
        briefId: string;
        amount: number;
        createdAt: Date;
        payment_status?: 'PENDING' | 'PAID' | 'FAILED';
        payment_method?: string;
        payment_id?: string;
    }
    | {
        state: 'PAYMENT_FAILED';
        id: string;
        clientId: string;
        briefId: string;
        createdAt: Date;
        payment_status: 'FAILED';
    }
    | {
        state: 'PAID'; // Was in_escrow
        id: string;
        clientId: string;
        briefId: string;
        amount: number;
        paymentIntentId: string;
        escrowedAt: Date;
        payment_status: 'PAID';
        payment_method: string;
        payment_id: string;
    }
    | {
        state: 'ASSIGNED';
        id: string;
        clientId: string;
        vendorId: string;
        briefId: string;
        amount: number;
        paymentIntentId: string;
        assignedAt: Date;
        slaDeadline: Date;
        payment_status: 'PAID';
        payment_id?: string;
    }
    | {
        state: 'IN_PRODUCTION';
        id: string;
        clientId: string;
        vendorId: string;
        briefId: string;
        amount: number;
        paymentIntentId: string;
        startedAt: Date;
        slaDeadline: Date;
        payment_status: 'PAID';
        payment_id?: string;
    }
    | {
        state: 'INTERNAL_REVIEW';
        id: string;
        clientId: string;
        vendorId: string;
        briefId: string;
        amount: number;
        paymentIntentId: string;
        deliverableUrl: string; // Submitted by vendor
        submittedAt: Date;
        payment_status: 'PAID';
        payment_id?: string;
    }
    | {
        state: 'UNDER_REVIEW';
        id: string;
        clientId: string;
        vendorId: string;
        briefId: string;
        amount: number;
        paymentIntentId: string;
        deliverableUrl: string;
        submittedAt: Date;
        payment_status: 'PAID';
        payment_id?: string;
    }
    | {
        state: 'REVISION_REQUESTED';
        id: string;
        clientId: string;
        vendorId: string;
        briefId: string;
        amount: number;
        paymentIntentId: string;
        deliverableUrl: string;
        feedback: string;
        payment_status: 'PAID';
        payment_id?: string;
    }
    | {
        state: 'DELIVERED'; // Client Approved
        id: string;
        clientId: string;
        vendorId: string;
        briefId: string;
        amount: number;
        paymentIntentId: string;
        deliverableUrl: string;
        clientSignature: string;
        completedAt: Date;
        payment_status: 'PAID';
        payment_id?: string;
    }
    | {
        state: 'COMPLETED'; // Funds Released
        id: string;
        clientId: string;
        vendorId: string;
        briefId: string;
        amount: number;
        paymentIntentId: string;
        deliverableUrl: string;
        clientSignature: string;
        completedAt: Date;
        vendorPaidAt: Date;
        payment_status: 'PAID';
        payment_id?: string;
    }
    | {
        state: 'DISPUTED';
        id: string;
        clientId: string;
        vendorId: string;
        briefId: string;
        amount: number;
        paymentIntentId: string;
        disputeReason: string;
        disputeOpenedAt: Date;
        evidenceCollected: boolean;
        payment_status?: string;
        payment_id?: string;
    }
    | {
        state: 'REFUNDED';
        id: string;
        clientId: string;
        amount: number;
        refundedAt: Date;
        refundReason: string;
        payment_status: 'REFUNDED';
        payment_id?: string;
    }
    | {
        state: 'CANCELLED';
        id: string;
        clientId: string;
        createdAt: Date;
        cancelledAt: Date;
        cancelReason: string;
    };

// ============================================
// TYPE GUARDS (Runtime Validation)
// ============================================

export function isOrderInEscrow(order: Order): order is Order & { state: 'PAID' } {
    return order.state === 'PAID';
}

export function isOrderDisputable(order: Order): boolean {
    return ['PAID', 'ASSIGNED', 'IN_PRODUCTION', 'INTERNAL_REVIEW', 'UNDER_REVIEW', 'REVISION_REQUESTED'].includes(order.state);
}

export function canReleasePayment(order: Order): order is Order & { state: 'DELIVERED' } {
    return order.state === 'DELIVERED' && 'clientSignature' in order;
}

// ============================================
// USER ROLES (RBAC)
// ============================================

export type UserRole = 'admin' | 'vendor' | 'client';

export type Permission =
    | 'orders:create'
    | 'orders:view:own'
    | 'orders:view:all'
    | 'orders:assign'
    | 'deliverables:upload'
    | 'deliverables:approve'
    | 'disputes:open'
    | 'disputes:resolve'
    | 'payments:view'
    | 'vendors:manage'
    | 'analytics:view';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    admin: [
        'orders:view:all',
        'orders:assign',
        'disputes:resolve',
        'payments:view',
        'vendors:manage',
        'analytics:view',
    ],
    vendor: [
        'orders:view:own',
        'deliverables:upload',
    ],
    client: [
        'orders:create',
        'orders:view:own',
        'deliverables:approve',
        'disputes:open',
    ],
};

// ============================================
// API RESPONSE TYPES (Standardized)
// ============================================

export type ApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: { code: string; message: string } };

export type PaginatedResponse<T> = ApiResponse<{
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
