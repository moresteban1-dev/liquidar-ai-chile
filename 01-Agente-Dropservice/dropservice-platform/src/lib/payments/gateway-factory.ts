// ============================================================
// lib/payments/gateway-factory.ts
// ============================================================

import { GatewaySlug, IPaymentGatewayService } from '@/types/payments';
import { FlowService } from './gateways/flow';
import { KhipuService } from './gateways/khipu';
import { ManualTransferService } from './gateways/manual-transfer';
import { WebpayService } from './gateways/webpay';

const gatewayInstances: Record<GatewaySlug, IPaymentGatewayService> = {
    webpay: new WebpayService(),
    manual_transfer: new ManualTransferService(),
    khipu: new KhipuService(),
    flow: new FlowService(),
};

export function getGatewayService(slug: GatewaySlug): IPaymentGatewayService {
    const service = gatewayInstances[slug];
    if (!service) {
        throw new Error(`Gateway "${slug}" no registrado`);
    }
    return service;
}

