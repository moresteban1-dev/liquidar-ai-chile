/**
 * Standardized Crypto utility for the platform
 * Focuses on UUID generation and hashing.
 */
export const crypto = {
  randomUUID: (): string => {
    // 1. Try modern standard (Node 19+, most browsers)
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }
    
    // 2. Node.js fallback
    try {
      const nodeCrypto = require('node:crypto');
      if (nodeCrypto.randomUUID) return nodeCrypto.randomUUID();
    } catch {
      // Fallback ignored
    }

    // 3. Last resort (not cryptographically secure but prevents crash)
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
};
