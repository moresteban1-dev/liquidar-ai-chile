// ============================================================
// lib/payments/payment-service.ts
// ============================================================

import { getContainer } from '@/infrastructure/di/Container';
import { DI_KEYS } from '@/infrastructure/di/DIKeys';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { getGatewayService } from './gateway-factory';
import { decryptConfig } from './encryption';
import {
    CreatePaymentRequest,
    CreatePaymentResponse,
    Payment,
    PaymentStatus,
    GatewaySlug,
    BankAccountData,
    PaymentGateway,
    GatewayConfig,
    ManualTransferConfig,
} from '@/types/payments';

export class PaymentService {

    // ─── Obtener Gateways Activos ──────────────────────────────
    static async getActiveGateways(): Promise<PaymentGateway[]> {
        const supabase = createServiceRoleClient();

        const { data, error } = await supabase
            .from('payment_gateways')
            .select('*')
            .eq('is_active', true);

        if (error) throw new Error(`Error al obtener gateways: ${error.message}`);

        // Desencriptar para uso interno (opcional) o mantener encriptado
        return (data || []).map((gw: Record<string, unknown>) => {
            // La config viene encriptada de la BD
            const decryptedConfig = decryptConfig(gw.config as Record<string, unknown>);
            return {
                ...gw,
                config: this.sanitizeConfig(gw.slug as GatewaySlug, decryptedConfig),
            } as unknown as PaymentGateway;
        });
    }

    // ─── Obtener Configuración Interna (Decrypted) ─────────────
    private static async getGatewayConfig(slug: GatewaySlug) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('payment_gateways')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error || !data) throw new Error('Gateway no encontrado');

        // Desencriptar credenciales para usar con SDKs
        const config = decryptConfig(data.config as Record<string, unknown>);
        return { ...data, config: config as unknown as GatewayConfig };
    }

    // ─── Crear Pago ────────────────────────────────────────────
    // Nota: userId viene del auth context
    static async createPayment(
        userId: string,
        request: CreatePaymentRequest
    ): Promise<CreatePaymentResponse> {
        const supabase = await createClient();

        // 1. Obtener gateway y config desencriptada
        const gateway = await this.getGatewayConfig(request.gateway_slug);

        if (!gateway.is_active) {
            throw new Error('Método de pago no disponible');
        }

        // 2. Calcular expiración
        // 2. Calcular expiración
        const isManual = request.gateway_slug === 'manual_transfer';
        const manualConfig = isManual ? (gateway.config as ManualTransferConfig) : null;

        // Defensive calculation to avoid RangeError: Invalid time value if expiration_hours is NaN/undefined
        const expirationHours = (isManual && manualConfig && typeof manualConfig.expiration_hours === 'number' && !isNaN(manualConfig.expiration_hours))
            ? manualConfig.expiration_hours
            : 24;

        const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString();

        // 2b. Cancel any existing pending or processing payment attempts for this order to prevent duplicates in client dashboard
        try {
            await supabase
                .from('payments')
                .update({ status: 'cancelled' as PaymentStatus, updated_at: new Date().toISOString() })
                .eq('order_id', request.order_id)
                .in('status', ['pending', 'processing', 'pending_review']);
        } catch (cancelErr) {
            logger.warn(`Failed to cancel older pending payments for order ${request.order_id}`, { error: String(cancelErr) });
        }

        // 3. Crear registro de pago en BD
        const { data: payment, error: payError } = await supabase
            .from('payments')
            .insert({
                order_id: request.order_id,
                user_id: userId,
                gateway_slug: request.gateway_slug,
                amount: request.amount,
                currency: request.currency || 'CLP',
                status: 'pending',
                expires_at: expiresAt,
                metadata: {},
            })
            .select()
            .single();

        if (payError || !payment) {
            throw new Error(`Error al crear pago: ${payError?.message}`);
        }

        // 4. Log de creación (sin await para no bloquear)
        this.createLog(payment.id, 'payment_created', null, 'pending', userId);

        // 5. Procesar según gateway
        const gatewayService = getGatewayService(request.gateway_slug);

        try {
            const result = await gatewayService.createPayment({
                payment: payment as Payment,
                config: gateway.config,
                returnUrl: request.return_url || `${process.env.NEXT_PUBLIC_APP_URL}/payments/success`,
                cancelUrl: request.cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/payments/cancel`,
            });

            // 6. Actualizar pago con datos de la pasarela
            const newStatus: PaymentStatus =
                request.gateway_slug === 'manual_transfer' ? 'pending' : 'processing';

            await supabase
                .from('payments')
                .update({
                    external_id: result.external_id,
                    status: newStatus,
                    metadata: { ...payment.metadata, ...result.metadata },
                })
                .eq('id', payment.id);

            this.createLog(
                payment.id, 'gateway_initiated', 'pending', newStatus, null,
                { external_id: result.external_id }
            );

            // 7. Preparar respuesta
            const response: CreatePaymentResponse = {
                payment_id: payment.id,
                status: newStatus,
                redirect_url: result.redirect_url, // undefined for Manual
                expires_at: expiresAt,
            };

            // Si es transferencia manual, incluir datos bancarios
            if (request.gateway_slug === 'manual_transfer') {
                response.bank_data = await this.getBankData();
                response.message = (gateway.config as ManualTransferConfig).instructions;
            }

            return response;

        } catch (error) {
            // Marcar pago como fallido
            await supabase
                .from('payments')
                .update({ status: 'rejected' as PaymentStatus, updated_at: new Date().toISOString() })
                .eq('id', payment.id);

            this.createLog(
                payment.id, 'gateway_error', 'pending', 'rejected', null,
                { error: String(error) }
            );

            throw error;
        }
    }

    // ─── Obtener Datos Bancarios ───────────────────────────────
    static async getBankData(): Promise<BankAccountData> {
        const supabase = await createClient();

        // Query the organization_settings singleton table where the admin saves bank details
        const { data, error } = await supabase
            .from('organization_settings')
            .select('*')
            .eq('id', '00000000-0000-0000-0000-000000000000')
            .maybeSingle();

        if (error || !data || !data.bank_name) {
            // Fallback defensively to legacy platform_settings if organization_settings has no bank details
            const { data: legacyData, error: legacyError } = await supabase
                .from('platform_settings')
                .select('setting_value')
                .eq('setting_key', 'bank_account_data')
                .single();

            if (legacyError || !legacyData) {
                throw new Error('Datos bancarios no configurados');
            }
            return legacyData.setting_value as BankAccountData;
        }

        // Map organization_settings directly to BankAccountData
        const isCorriente = data.account_type?.toLowerCase().includes('corriente') || data.account_type?.toLowerCase().includes('vista');
        const isVista = data.account_type?.toLowerCase().includes('vista');
        const accountTypeMapped: 'corriente' | 'vista' | 'ahorro' = isVista ? 'vista' : (isCorriente ? 'corriente' : 'ahorro');

        return {
            bank_name: data.bank_name || 'No especificado',
            account_type: accountTypeMapped,
            account_number: data.account_number || '',
            holder_name: data.legal_name || data.company_name || 'No especificado',
            holder_rut: data.legal_rut || '',
            holder_email: data.contact_email || '',
            additional_notes: 'Indicar número de orden en la descripción de la transferencia'
        };
    }

    // ─── Procesar Webhook ──────────────────────────────────────
    static async processWebhook(
        gatewaySlug: GatewaySlug,
        eventType: string,
        payload: Record<string, unknown>
    ): Promise<void> {
        const supabase = createServiceRoleClient();

        // 1. Registrar evento
        const { data: event } = await supabase
            .from('webhook_events')
            .insert({
                gateway_slug: gatewaySlug,
                event_type: eventType,
                payload,
                processed: false,
            })
            .select()
            .single();

        try {
            // 2. Encontrar el pago relacionado
            const externalRef = this.extractExternalReference(gatewaySlug, payload);

            const { data: payment } = await supabase
                .from('payments')
                .select('*')
                .or(`external_id.eq.${externalRef},id.eq.${externalRef}`)
                .single(); // Use single() carefully, maybe limit 1?

            if (!payment) {
                logger.error(`[Webhook] Pago no encontrado para ref: ${externalRef} en pasarela ${gatewaySlug}`);
                throw new Error(`Pago no encontrado para ref: ${externalRef}`);
            }

            // 2b. Terminal Status Check (H5 Audit)
            if (payment.status === 'approved') {
                logger.info(`[Webhook] Ignorando evento para pago ${payment.id} ya aprobado (Terminal Status).`);
                await supabase
                    .from('webhook_events')
                    .update({ processed: true, payment_id: payment.id, error_message: 'Terminal status already reached' })
                    .eq('id', event?.id);
                return;
            }

            // 3. Obtener configuración del gateway
            const gateway = await this.getGatewayConfig(gatewaySlug);

            // 4. Verificar pago con la pasarela
            const gatewayService = getGatewayService(gatewaySlug);
            const result = await gatewayService.verifyPayment({
                payment: payment as Payment,
                config: gateway.config,
                webhookData: payload,
            });

            // 5. Actualizar estado del pago
            const oldStatus = payment.status;

            const hasMetadataChanges = JSON.stringify(payment.metadata) !== JSON.stringify({ ...payment.metadata, ...result.metadata });

            // Only update if status changed or we have new metadata
            if (oldStatus !== result.status || hasMetadataChanges) {
                // LOCK-FREE ATOMIC UPDATE: Only update if the status is still what we fetched.
                // This prevents race conditions between two concurrent webhooks.
                const { data: updatedRows, error: updateError } = await supabase
                    .from('payments')
                    .update({
                        status: result.status,
                        metadata: { ...payment.metadata, ...result.metadata },
                        paid_at: result.status === 'approved' ? new Date().toISOString() : payment.paid_at,
                    })
                    .match({ id: payment.id, status: oldStatus })
                    .select();

                if (updateError) throw updateError;
                
                if (!updatedRows || updatedRows.length === 0) {
                    // This means another process (like another webhook) updated the status while we were verifyng this one.
                    logger.warn(`[Concurrency] Webhook conflict for payment ${payment.id}. Current status already changed from ${oldStatus}. Skipping post-actions.`);
                    
                    await supabase
                        .from('webhook_events')
                        .update({ processed: true, payment_id: payment.id, error_message: 'Concurrent update ignored' })
                        .eq('id', event?.id);
                    return;
                }

                // 6. Log
                this.createLog(
                    payment.id,
                    `webhook_${eventType}`,
                    oldStatus,
                    result.status,
                    null,
                    { webhook_event_id: event?.id }
                );

                // 7. Marcar evento como procesado
                await supabase
                    .from('webhook_events')
                    .update({ processed: true, payment_id: payment.id })
                    .eq('id', event?.id);

                // 8. Disparar acciones post-pago
                if (result.status === 'approved' && oldStatus !== 'approved') {
                    await this.onPaymentApproved(payment.id, payment.order_id);
                }
            } else {
                // processed anyway
                await supabase
                    .from('webhook_events')
                    .update({ processed: true, payment_id: payment.id })
                    .eq('id', event?.id);
            }

        } catch (error) {
            // Registrar error en el evento
            await supabase
                .from('webhook_events')
                .update({
                    processed: false,
                    error_message: String(error),
                })
                .eq('id', event?.id);

            throw error;
        }
    }

    // ─── Confirmar Transferencia Manual (Admin) ────────────────
    static async confirmManualTransfer(
        paymentId: string,
        adminId: string,
        action: 'approve' | 'reject',
        notes?: string
    ): Promise<void> {
        const supabase = await createClient();

        const { data: payment } = await supabase
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .eq('gateway_slug', 'manual_transfer')
            .single();

        if (!payment) throw new Error('Pago no encontrado');
        if (payment.status !== 'pending_review') {
            throw new Error('Este pago no está pendiente de revisión');
        }

        const newStatus: PaymentStatus =
            action === 'approve' ? 'approved' : 'rejected';

        await supabase
            .from('payments')
            .update({
                status: newStatus,
                paid_at: action === 'approve' ? new Date().toISOString() : null,
                metadata: {
                    ...payment.metadata,
                    admin_notes: notes,
                    reviewed_by: adminId,
                    reviewed_at: new Date().toISOString(),
                },
            })
            .eq('id', paymentId);

        this.createLog(
            paymentId,
            `manual_${action}`,
            'pending_review',
            newStatus,
            adminId,
            { notes }
        );

        if (action === 'approve') {
            await this.onPaymentApproved(paymentId, payment.order_id);
        }
    }

    // ─── Subir Comprobante (Usuario) ───────────────────────────
    static async uploadReceipt(
        paymentId: string,
        userId: string,
        receiptFile: File,
        transferData: {
            sender_name: string;
            sender_rut: string;
            sender_bank: string;
            transfer_date: string;
        }
    ): Promise<void> {
        const supabase = await createClient();

        // 1. Verificar que el pago pertenece al usuario
        const { data: payment } = await supabase
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .eq('user_id', userId)
            .eq('gateway_slug', 'manual_transfer')
            .single();

        if (!payment) throw new Error('Pago no encontrado');

        // 2. Subir archivo a Supabase Storage
        const fileName = `receipts/${paymentId}/${Date.now()}-${receiptFile.name}`;
        const { error: uploadError } = await supabase
            .storage
            .from('payment-receipts')
            .upload(fileName, receiptFile, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) throw new Error('Error al subir comprobante');

        // 3. Obtener URL pública
        const { data: { publicUrl } } = supabase
            .storage
            .from('payment-receipts')
            .getPublicUrl(fileName);

        // 4. Actualizar pago
        await supabase
            .from('payments')
            .update({
                status: 'pending_review',
                metadata: {
                    ...payment.metadata,
                    transfer_receipt_url: publicUrl,
                    ...transferData,
                },
            })
            .eq('id', paymentId);

        this.createLog(
            paymentId, 'receipt_uploaded', payment.status, 'pending_review', userId
        );
    }

    // ─── Acciones Post-Pago ────────────────────────────────────
    private static async onPaymentApproved(
        _paymentId: string,
        orderId: string
    ): Promise<void> {
        const supabase = createServiceRoleClient();

        // Obtener la orden para encontrar la cotización relacionada
        const { data: orderEntity } = await supabase
            .from('orders')
            .select('quotation_id')
            .eq('id', orderId)
            .single();

        if (orderEntity && orderEntity.quotation_id) {
            // Unificado bajo el contenedor principal
            const container = await getContainer();
            const quotationService = await container.resolve<any>('QuotationService');
            await quotationService.transitionQuotation(
                orderEntity.quotation_id,
                'PAID', // Uses string literal matching QuotationStatus union
                { internalNotes: 'Pago procesado automáticamente por webhook' }
            );
        } else {
            logger.warn(`No quotation associated for order ${orderId} during payment approval.`);
        }

        // EVENT: trigger notification email
        const { data: orderDetails } = await supabase
            .from('orders')
            .select(`
                code,
                client:profiles!orders_client_id_fkey(email, name)
            `)
            .eq('id', orderId)
            .single();

        if (orderDetails) {
            const clientData = Array.isArray(orderDetails.client) ? orderDetails.client[0] : orderDetails.client;
            if (clientData?.email) {
                const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/orders/${orderId}`;
                const container = await getContainer();
                const emailService = await container.resolve<any>(DI_KEYS.EmailService);
                await emailService.sendPaymentConfirmation(clientData.email, orderDetails.code, dashboardUrl);
            }
        }
        // EVENT: trigger provider notification
    }

    // ─── Helpers ───────────────────────────────────────────────
    private static async createLog(
        paymentId: string,
        action: string,
        oldStatus: PaymentStatus | null,
        newStatus: PaymentStatus,
        performedBy: string | null,
        details: Record<string, unknown> = {}
    ) {
        try {
            // Log creation shouldn't fail the transaction, use service role if no user
            const supabase = performedBy ? await createClient() : createServiceRoleClient();
            await supabase.from('payment_logs').insert({
                payment_id: paymentId,
                action,
                old_status: oldStatus,
                new_status: newStatus,
                performed_by: performedBy,
                details,
            });
        } catch (e) {
            logger.error("Failed to create log", e as Error);
        }
    }

    private static extractExternalReference(
        slug: GatewaySlug,
        payload: Record<string, unknown>
    ): string {
        try {
            switch (slug) {
                case 'webpay':
                    return (payload.token_ws as string) || '';
                case 'khipu':
                    return (payload.payment_id as string) || (payload.notification_token as string) || '';
                case 'flow':
                    // Flow sometimes sends token or flowOrder
                    return (payload.token as string) || (payload.flowOrder?.toString()) || '';
                default:
                    return '';
            }
        } catch (e) {
            logger.error(`Error extracting reference for ${slug}`, e as Error);
            return '';
        }
    }

    private static sanitizeConfig(
        _slug: string,
        config: Record<string, unknown>
    ): Record<string, unknown> {
        // No exponer credenciales al frontend
        const sanitized = { ...config };
        const sensitiveKeys = [
            'access_token', 'api_key', 'webhook_secret',
            'public_key', 'commerce_code',
        ];
        for (const key of sensitiveKeys) {
            if (key in sanitized) {
                sanitized[key] = sanitized[key] ? '••••••••' : '';
            }
        }
        return sanitized;
    }
}
