// src/infrastructure/notifications/webhook/WebhookSignature.ts

export class WebhookSignature {
  static async sign(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload),
    );

    const hashArray = Array.from(new Uint8Array(signature));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `sha256=${hex}`;
  }

  static async verify(payload: string, secret: string, signature: string): Promise<boolean> {
    const expected = await WebhookSignature.sign(payload, secret);
    return WebhookSignature.constantTimeEqual(expected, signature);
  }

  private static constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}
