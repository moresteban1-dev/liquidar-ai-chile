// ============================================================
// types/payments.ts
// ============================================================

export type PaymentStatus =
    | 'pending'
    | 'processing'
    | 'approved'
    | 'rejected'
    | 'cancelled'
    | 'refunded'
    | 'expired'
    | 'pending_review';

export type GatewaySlug = 'webpay' | 'manual_transfer' | 'khipu' | 'flow';

export type Currency = 'CLP' | 'USD' | 'ARS';

// ─── Configuraciones por Gateway ────────────────────────────



export interface WebpayConfig {
    commerce_code: string;
    api_key: string;
    environment: 'integration' | 'production';
    return_url: string;
}

export interface ManualTransferConfig {
    expiration_hours: number;
    instructions: string;
    auto_expire: boolean;
}

export interface KhipuConfig {
    receiver_id: string;
    secret: string;
}

export interface FlowConfig {
    api_key: string;
    secret_key: string;
    environment: 'sandbox' | 'production';
}

export type GatewayConfig =
    | WebpayConfig
    | ManualTransferConfig
    | KhipuConfig
    | FlowConfig;

// ─── Entidades ──────────────────────────────────────────────

export interface PaymentGateway {
    id: string;
    name: string;
    slug: GatewaySlug;
    description: string;
    is_active: boolean;
    config: GatewayConfig;
    display_order: number;
    icon_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Payment {
    id: string;
    order_id: string;
    user_id: string;
    gateway_slug: GatewaySlug;
    external_id: string | null;
    amount: number;
    currency: Currency;
    status: PaymentStatus;
    metadata: PaymentMetadata;
    paid_at: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface PaymentMetadata {


    // Webpay
    wp_token?: string;
    wp_buy_order?: string;
    wp_session_id?: string;
    wp_authorization_code?: string;
    wp_card_last_four?: string;
    wp_transaction_date?: string;

    // Khipu
    khipu_payment_id?: string;
    khipu_payment_url?: string;
    khipu_simplified_url?: string;
    khipu_bank_id?: string;
    khipu_transfer_date?: string;
    khipu_status?: string;

    // Flow
    flow_token?: string;
    flow_order?: string;
    flow_url?: string;
    flow_payment_method?: string;
    flow_payment_date?: string;
    flow_status_code?: number;

    // Transferencia Manual
    transfer_receipt_url?: string;
    transfer_date?: string;
    sender_name?: string;
    sender_rut?: string;
    sender_bank?: string;
    admin_notes?: string;
    reviewed_by?: string;
    reviewed_at?: string;

    // Generic
    error?: string;
    [key: string]: unknown;
}

export interface PaymentLog {
    id: string;
    payment_id: string;
    action: string;
    old_status: PaymentStatus | null;
    new_status: PaymentStatus;
    performed_by: string | null;
    details: Record<string, unknown>;
    created_at: string;
}

export interface WebhookEvent {
    id: string;
    gateway_slug: GatewaySlug;
    event_type: string;
    payload: Record<string, unknown>;
    processed: boolean;
    payment_id: string | null;
    error_message: string | null;
    created_at: string;
}

export interface BankAccountData {
    bank_name: string;
    account_type: 'corriente' | 'vista' | 'ahorro';
    account_number: string;
    holder_name: string;
    holder_rut: string;
    holder_email: string;
    additional_notes: string;
}

// ─── DTOs (Request/Response) ────────────────────────────────

export interface CreatePaymentRequest {
    order_id: string;
    gateway_slug: GatewaySlug;
    amount: number;
    currency?: Currency;
    return_url?: string;
    cancel_url?: string;
    // Para transferencia manual
    transfer_data?: {
        sender_name: string;
        sender_rut: string;
        sender_bank: string;
        transfer_date: string;
    };
}

export interface CreatePaymentResponse {
    payment_id: string;
    status: PaymentStatus;
    // Según la pasarela:
    redirect_url?: string;      // Webpay
    bank_data?: BankAccountData; // Transferencia manual
    expires_at?: string;
    message?: string;
}

export interface PaymentStatusResponse {
    payment: Payment;
    gateway: Pick<PaymentGateway, 'name' | 'slug' | 'icon_url'>;
    logs: PaymentLog[];
}

export interface ToggleGatewayRequest {
    is_active: boolean;
    gateway_id?: string; // Added to match admin route usage
}

export interface UpdateGatewayConfigRequest {
    config: Partial<GatewayConfig>;
    gateway_id?: string;
    is_active?: boolean;
}

// ─── Interfaz del Gateway (Strategy Pattern) ────────────────

export interface IPaymentGatewayService {
    slug: GatewaySlug;

    createPayment(params: {
        payment: Payment;
        config: GatewayConfig;
        returnUrl: string;
        cancelUrl: string;
    }): Promise<{
        external_id: string;
        redirect_url?: string;
        metadata: Partial<PaymentMetadata>;
    }>;

    verifyPayment(params: {
        payment: Payment;
        config: GatewayConfig;
        webhookData?: Record<string, unknown>;
    }): Promise<{
        status: PaymentStatus;
        metadata: Partial<PaymentMetadata>;
    }>;

    refundPayment?(params: {
        payment: Payment;
        config: GatewayConfig;
        amount?: number;
    }): Promise<{
        success: boolean;
        refund_id?: string;
    }>;
}
