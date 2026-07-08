// ============================================================
// lib/payments/encryption.ts
// Encrypt sensitive credentials before persisting to DB.
//
// Uses AES-256-GCM with scrypt key derivation (Node.js native).
// Maintains backward compatibility with legacy CryptoJS format.
// ============================================================

import { scryptSync, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

/** Encryption constants */
const ALGORITHM = 'aes-256-gcm' as const;
const KEY_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // GCM recommended IV length
const AUTH_TAG_LENGTH = 16;
const SCRYPT_COST = 16384; // N parameter
const ENCODING_PREFIX = 'v2-'; // Prefix to distinguish from legacy CryptoJS format

/** Sensitive keys that require encryption before storage. */
const SENSITIVE_KEYS = [
    'access_token', 'api_key', 'webhook_secret',
    'public_key', 'commerce_code',
    'secret', 'receiver_id', 'secret_key',
] as const;

/**
 * Retrieves the encryption key from environment.
 * @throws Error if ENCRYPTION_KEY is not configured.
 */
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

/**
 * Derives a 256-bit key from a passphrase using scrypt.
 */
function deriveKey(passphrase: string, salt: Buffer): Buffer {
    return scryptSync(passphrase, salt, KEY_LENGTH, { N: SCRYPT_COST });
}

/**
 * Encrypts a plaintext string using AES-256-GCM with scrypt key derivation.
 * Output format: "v2:<salt_hex>:<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */
function encryptValue(plaintext: string, passphrase: string): string {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const key = deriveKey(passphrase, salt);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
        ENCODING_PREFIX + salt.toString('hex'),
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted.toString('hex'),
    ].join(':');
}

/**
 * Decrypts a value encrypted with AES-256-GCM (v2 format).
 */
function decryptValueV2(encryptedStr: string, passphrase: string): string {
    const parts = encryptedStr.split(':');
    if (parts.length !== 4) {
        throw new Error('Invalid v2 encrypted format');
    }

    const [prefixedSalt, ivHex, authTagHex, ciphertextHex] = parts;
    if (!prefixedSalt || !ivHex || !authTagHex || !ciphertextHex) {
        throw new Error('Invalid v2 encrypted format (missing components)');
    }

    const salt = Buffer.from(prefixedSalt.slice(ENCODING_PREFIX.length), 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    const key = deriveKey(passphrase, salt);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);

    return decrypted.toString('utf8');
}

/**
 * Attempts to decrypt legacy CryptoJS AES format.
 * CryptoJS stores data as "Salted__" + 8-byte salt + ciphertext, base64 encoded.
 * Uses MD5-based EVP key derivation (OpenSSL compatible).
 *
 * This is kept ONLY for backward compatibility with existing encrypted data.
 * All new encryptions use the v2 format.
 */
function decryptLegacyCryptoJS(encryptedStr: string, passphrase: string): string {
    // Dynamic import avoided — inline minimal OpenSSL-compatible EVP decryption
    const { createHash } = require('node:crypto') as typeof import('crypto');

    const rawData = Buffer.from(encryptedStr, 'base64');

    // CryptoJS format: "Salted__" (8 bytes) + salt (8 bytes) + ciphertext
    const saltMarker = rawData.subarray(0, 8).toString('utf8');
    if (saltMarker !== 'Salted__') {
        throw new Error('Not a CryptoJS encrypted value (missing Salted__ prefix)');
    }

    const salt = rawData.subarray(8, 16);
    const ciphertext = rawData.subarray(16);

    // EVP_BytesToKey with MD5 (CryptoJS default for passphrase mode)
    const passphraseBuffer = Buffer.from(passphrase, 'utf8');
    let derivedKey = Buffer.alloc(0);
    let block = Buffer.alloc(0);

    while (derivedKey.length < 48) { // 32 bytes key + 16 bytes IV
        block = createHash('md5')
            .update(Buffer.concat([block, passphraseBuffer, salt]))
            .digest();
        derivedKey = Buffer.concat([derivedKey, block]);
    }

    const key = derivedKey.subarray(0, 32);
    const iv = derivedKey.subarray(32, 48);

    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);

    return decrypted.toString('utf8');
}

/**
 * Encrypts all sensitive fields in a configuration object.
 * Uses AES-256-GCM with scrypt key derivation.
 */
export function encryptConfig(
    config: Record<string, unknown>
): Record<string, unknown> {
    const passphrase = getEncryptionKey();
    const encrypted = { ...config };

    for (const key of SENSITIVE_KEYS) {
        if (encrypted[key] && typeof encrypted[key] === 'string') {
            encrypted[key] = encryptValue(
                encrypted[key] as string,
                passphrase
            );
        }
    }
    return encrypted;
}

/**
 * Decrypts all sensitive fields in a configuration object.
 * Attempts v2 format first, falls back to legacy CryptoJS for backward compatibility.
 */
export function decryptConfig(
    config: Record<string, unknown>
): Record<string, unknown> {
    const passphrase = getEncryptionKey();
    const decrypted = { ...config };

    for (const key of SENSITIVE_KEYS) {
        if (decrypted[key] && typeof decrypted[key] === 'string') {
            const value = decrypted[key] as string;
            try {
                if (value.startsWith(ENCODING_PREFIX)) {
                    // New v2 format (AES-256-GCM + scrypt)
                    decrypted[key] = decryptValueV2(value, passphrase);
                } else {
                    // Legacy CryptoJS format (AES-256-CBC + MD5 EVP)
                    decrypted[key] = decryptLegacyCryptoJS(value, passphrase);
                }
            } catch {
                // If decryption fails, value might be plaintext — leave as-is
            }
        }
    }
    return decrypted;
}
