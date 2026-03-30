/**
 * Standardized Crypto utility for the platform
 * Focuses on UUID generation and hashing.
 */
export const crypto = {
  randomUUID: (): string => {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    // Node.js fallback or older browsers
    const cryptoNode = require('crypto');
    return cryptoNode.randomUUID ? cryptoNode.randomUUID() : cryptoNode.createHash('sha256').update(Math.random().toString()).digest('hex');
  }
};
