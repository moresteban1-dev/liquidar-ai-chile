/**
 * Order Status Badge Mapping
 * Kaizen Poka-Yoke: Centralized state-to-UI mapping
 */

import { OrderState } from '@/types/order';
import { BadgeStatus } from '@/types/ui';

export const ORDER_STATE_CONFIG: Record<OrderState, {
    label: string;
    status: BadgeStatus;
    description: string;
}> = {
    DRAFT: {
        label: 'Borrador',
        status: 'neutral',
        description: 'La orden está siendo preparada',
    },
    PENDING_PAYMENT: {
        label: 'Pendiente de Pago',
        status: 'warning',
        description: 'Esperando el pago del cliente',
    },
    PAYMENT_FAILED: {
        label: 'Pago Fallido',
        status: 'error',
        description: 'El pago fue rechazado',
    },
    PAID: {
        label: 'Pagada / En Escrow',
        status: 'info',
        description: 'Pago recibido, esperando asignación',
    },
    ASSIGNED: {
        label: 'Asignada',
        status: 'info',
        description: 'Proveedor asignado a la orden',
    },
    IN_PRODUCTION: {
        label: 'En Producción',
        status: 'info',
        description: 'El proveedor está trabajando',
    },
    INTERNAL_REVIEW: {
        label: 'Revisión Interna (QA)',
        status: 'warning',
        description: 'Admin revisando entregable',
    },
    UNDER_REVIEW: {
        label: 'En Revisión (Cliente)',
        status: 'warning',
        description: 'Cliente revisando entregable',
    },
    REVISION_REQUESTED: {
        label: 'Con Observaciones',
        status: 'warning',
        description: 'Cliente solicitó cambios',
    },
    DELIVERED: {
        label: 'Entregada',
        status: 'success',
        description: 'Entregable aprobado por cliente',
    },
    COMPLETED: {
        label: 'Completada',
        status: 'success',
        description: 'Fondos liberados al proveedor',
    },
    DISPUTED: {
        label: 'En Disputa',
        status: 'error',
        description: 'Disputa abierta, fondos congelados',
    },
    REFUNDED: {
        label: 'Reembolsada',
        status: 'neutral',
        description: 'Orden reembolsada al cliente',
    },
    CANCELLED: {
        label: 'Cancelada',
        status: 'neutral',
        description: 'Orden cancelada',
    },
};
