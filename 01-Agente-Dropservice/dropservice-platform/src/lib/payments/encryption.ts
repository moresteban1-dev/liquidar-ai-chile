// ============================================================
// lib/payments/encryption.ts
// Encriptar credenciales sensibles antes de guardar en BD
// ============================================================

import CryptoJS from 'crypto-js';

function getEncryptionKey(): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error(
            '[SECURITY] ENCRYPTION_KEY env var is required. ' +
            'Set it in .env.local for development or Vercel dashboard for production.'
        );
    }
    return key;
}

export function encryptConfig(
    config: Record<string, unknown>
): Record<string, unknown> {
    const sensitiveKeys = [
        'access_token', 'api_key', 'webhook_secret',
        'public_key', 'commerce_code',
        'secret', 'receiver_id', 'secret_key',
    ];

    const encrypted = { ...config };
    for (const key of sensitiveKeys) {
        if (encrypted[key] && typeof encrypted[key] === 'string') {
            encrypted[key] = CryptoJS.AES.encrypt(
                encrypted[key] as string,
                getEncryptionKey()
            ).toString();
        }
    }
    return encrypted;
}

export function decryptConfig(
    config: Record<string, unknown>
): Record<string, unknown> {
    const sensitiveKeys = [
        'access_token', 'api_key', 'webhook_secret',
        'public_key', 'commerce_code',
        'secret', 'receiver_id', 'secret_key',
    ];

    const decrypted = { ...config };
    for (const key of sensitiveKeys) {
        if (decrypted[key] && typeof decrypted[key] === 'string') {
            try {
                const bytes = CryptoJS.AES.decrypt(
                    decrypted[key] as string,
                    getEncryptionKey()
                );
                decrypted[key] = bytes.toString(CryptoJS.enc.Utf8);
            } catch {
                // Si no está encriptado, dejarlo como está
            }
        }
    }
    return decrypted;
}
