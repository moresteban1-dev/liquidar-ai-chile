// ============================================================
// lib/payments/gateways/manual-transfer.ts
// ============================================================

import { ManualTransferConfig, Payment, PaymentStatus } from '@/types/payments';
import type { IPaymentGatewayService } from '@/types/payments';

export class ManualTransferService implements IPaymentGatewayService {
    slug = 'manual_transfer' as const;

    async createPayment(params: {
        payment: Payment;
        config: ManualTransferConfig;
        returnUrl: string;
        cancelUrl: string;
    }) {
        const { payment } = params;

        // No hay pasarela externa, solo calculamos fecha de expiración
        // El ID externa es interno para referencia
        const externalId = `MANUAL-${payment.id.slice(0, 8)}-${Date.now()}`;

        return {
            external_id: externalId,
            redirect_url: undefined, // No redirige, muestra datos bancarios en el frontend
            metadata: {
                transfer_date: '',
                sender_name: '',
                sender_rut: '',
                sender_bank: '',
            },
        };
    }

    async verifyPayment(params: {
        payment: Payment;
        config: ManualTransferConfig;
        webhookData?: Record<string, unknown>;
    }) {
        // La verificación manual la hace el admin explícitamente
        // Este método se usa cuando el admin confirma/rechaza vía API interna
        const action = params.webhookData?.action as string;

        if (action === 'approve') {
            return {
                status: 'approved' as PaymentStatus,
                metadata: {
                    admin_notes: params.webhookData?.notes as string,
                    reviewed_by: params.webhookData?.admin_id as string,
                    reviewed_at: new Date().toISOString(),
                },
            };
        }

        if (action === 'reject') {
            return {
                status: 'rejected' as PaymentStatus,
                metadata: {
                    admin_notes: params.webhookData?.notes as string,
                    reviewed_by: params.webhookData?.admin_id as string,
                    reviewed_at: new Date().toISOString(),
                },
            };
        }

        return {
            status: 'pending_review' as PaymentStatus,
            metadata: {},
        };
    }
}
