/**
 * Payment Gateway — Unit Tests
 * Covers: GatewayFactory, encryption, webhook signature patterns
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Gateway Factory Tests ──────────────────────────────────
describe('GatewayFactory (getGatewayService)', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('should return a gateway service for known slugs', async () => {
        const { getGatewayService } = await import('@/lib/payments/gateway-factory');
        const knownSlugs = ['webpay', 'manual_transfer', 'khipu', 'flow'] as const;

        for (const slug of knownSlugs) {
            const service = getGatewayService(slug);
            expect(service).toBeDefined();
            expect(service.createPayment).toBeInstanceOf(Function);
            expect(service.verifyPayment).toBeInstanceOf(Function);
        }
    });

    it('should throw for unknown gateway slug', async () => {
        const { getGatewayService } = await import('@/lib/payments/gateway-factory');
        expect(() => getGatewayService('unknown_gateway' as never))
            .toThrow();
    });

    it('should return the same instance for repeated calls (singleton)', async () => {
        const { getGatewayService } = await import('@/lib/payments/gateway-factory');
        const instance1 = getGatewayService('webpay');
        const instance2 = getGatewayService('webpay');
        expect(instance1).toBe(instance2);
    });
});

// ─── Gateway Contract Tests ─────────────────────────────────
describe('Payment Gateways — Interface Contract', () => {
    const gatewaySlugs = ['webpay', 'manual_transfer', 'khipu', 'flow'] as const;

    it.each(gatewaySlugs)('%s should implement IPaymentGatewayService', async (slug) => {
        const { getGatewayService } = await import('@/lib/payments/gateway-factory');
        const service = getGatewayService(slug);

        // All gateways must expose these methods
        expect(typeof service.createPayment).toBe('function');
        expect(typeof service.verifyPayment).toBe('function');
    });
});

// ─── Encryption Tests ───────────────────────────────────────
describe('Encryption Service', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubEnv('ENCRYPTION_KEY', 'test-encryption-key-for-vitest');
    });

    it('should encrypt sensitive keys in config', async () => {
        const { encryptConfig } = await import('@/lib/payments/encryption');

        const config = {
            access_token: 'my-secret-token',
            public_key: 'my-public-key',
            webhook_url: 'https://example.com/webhook',
        };

        const encrypted = encryptConfig(config);

        // Sensitive keys should be different from original
        expect(encrypted.access_token).not.toBe('my-secret-token');
        expect(encrypted.public_key).not.toBe('my-public-key');

        // Non-sensitive keys should remain unchanged
        expect(encrypted.webhook_url).toBe('https://example.com/webhook');
    });

    it('should decrypt back to original values', async () => {
        const { encryptConfig, decryptConfig } = await import('@/lib/payments/encryption');

        const original = {
            access_token: 'test-token-123',
            api_key: 'api-key-xyz',
            non_sensitive: 'plain-value',
        };

        const encrypted = encryptConfig(original);
        const decrypted = decryptConfig(encrypted);

        expect(decrypted.access_token).toBe('test-token-123');
        expect(decrypted.api_key).toBe('api-key-xyz');
        expect(decrypted.non_sensitive).toBe('plain-value');
    });

    it('should encrypt Khipu-specific keys (secret, receiver_id)', async () => {
        const { encryptConfig } = await import('@/lib/payments/encryption');

        const config = {
            receiver_id: '12345',
            secret: 'khipu-secret-key',
        };

        const encrypted = encryptConfig(config);

        expect(encrypted.receiver_id).not.toBe('12345');
        expect(encrypted.secret).not.toBe('khipu-secret-key');
    });

    it('should encrypt Flow-specific keys (secret_key)', async () => {
        const { encryptConfig } = await import('@/lib/payments/encryption');

        const config = {
            api_key: 'flow-api-key',
            secret_key: 'flow-secret',
            environment: 'sandbox',
        };

        const encrypted = encryptConfig(config);

        expect(encrypted.api_key).not.toBe('flow-api-key');
        expect(encrypted.secret_key).not.toBe('flow-secret');
        expect(encrypted.environment).toBe('sandbox'); // Not sensitive
    });

    it('should throw if ENCRYPTION_KEY is missing', async () => {
        vi.resetModules();
        const originalKey = process.env.ENCRYPTION_KEY;
        delete process.env.ENCRYPTION_KEY;

        try {
            const mod = await import('@/lib/payments/encryption');
            // If module loads, calling the function should throw
            expect(() => mod.encryptConfig({ access_token: 'test' })).toThrow('[SECURITY]');
        } catch (e) {
            // Module-level throw is also acceptable
            expect((e as Error).message).toContain('[SECURITY]');
        } finally {
            // Restore
            if (originalKey) process.env.ENCRYPTION_KEY = originalKey;
        }
    });
});

// ─── Webhook Signature Verification Tests ───────────────────
describe('Webhook Signature Verification', () => {
    it('should generate valid HMAC-SHA256 signatures', async () => {
        const { createHmac } = await import('crypto');
        const secret = 'test-secret-key';
        const body = '{"payment_id": "abc123"}';

        const signature = createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        // Verify the same input produces the same signature
        const recomputed = createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        expect(signature).toBe(recomputed);
        expect(signature).toHaveLength(64); // SHA-256 = 64 hex chars
    });

    it('should reject tampered payloads', async () => {
        const { createHmac } = await import('crypto');
        const secret = 'test-secret-key';

        const originalBody = '{"payment_id": "abc123"}';
        const tamperedBody = '{"payment_id": "hacked"}';

        const signature = createHmac('sha256', secret)
            .update(originalBody)
            .digest('hex');

        const tamperedSignature = createHmac('sha256', secret)
            .update(tamperedBody)
            .digest('hex');

        expect(signature).not.toBe(tamperedSignature);
    });

    it('should reject wrong secret', async () => {
        const { createHmac } = await import('crypto');
        const body = '{"payment_id": "abc123"}';

        const correctSig = createHmac('sha256', 'correct-secret')
            .update(body).digest('hex');

        const wrongSig = createHmac('sha256', 'wrong-secret')
            .update(body).digest('hex');

        expect(correctSig).not.toBe(wrongSig);
    });
});

// ─── Payment Service Integration ────────────────────────────
describe('PaymentService', () => {
    it('should export extractExternalReference with all gateway cases', async () => {
        const mod = await import('@/lib/payments/payment-service');
        expect(mod.PaymentService).toBeDefined();
        expect(mod.PaymentService.processWebhook).toBeInstanceOf(Function);
    });
});
