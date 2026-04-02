/**
 * Redirect Validator — Identity Fortress
 * 
 * Multi-layer protection against Open Redirect & XSS (javascript: URIs)
 * 
 * Rules:
 * 1. Only relative paths starting with / (excluding //) are allowed by default.
 * 2. Absolute URLs must match ALLOWED_HOSTS.
 * 3. Dangerous protocols (javascript:, data:, etc.) are blocked.
 */

const ALLOWED_HOSTS = new Set([
    'localhost',
    'dropservice.platform', // Production domain (placeholder)
    // Add production/staging domains here
]);

const ALLOWED_PROTOCOLS = new Set(['https:']);
if (process.env.NODE_ENV === 'development') {
    ALLOWED_PROTOCOLS.add('http:');
}

/**
 * Normalizes and validates a redirect URL
 * Returns the safe URL or a fallback path
 */
export function validateRedirectUrl(
    url: string | null | undefined,
    fallback: string = '/client'
): string {
    if (!url || typeof url !== 'string') return fallback;

    const trimmed = url.trim();

    // 1. Block Dangerous Protocols (Mitigate XSS)
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'blob:', 'file:'];
    const lowerUrl = trimmed.toLowerCase().replace(/\s/g, '');
    for (const proto of dangerousProtocols) {
        if (lowerUrl.startsWith(proto)) {
            console.error(`[SECURITY] Blocked dangerous redirect protocol: ${trimmed}`);
            return fallback;
        }
    }

    // 2. Block Protocol-Relative Redirects (//evil.com)
    if (trimmed.startsWith('//')) {
        console.error(`[SECURITY] Blocked protocol-relative redirect: ${trimmed}`);
        return fallback;
    }

    // 3. Handle Relative Paths (Safe)
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
        return trimmed;
    }

    // 4. Handle Absolute URLs
    try {
        const parsed = new URL(trimmed);

        // Verify Protocol
        if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
            console.error(`[SECURITY] Blocked redirect with unauthorized protocol: ${parsed.protocol}`);
            return fallback;
        }

        // Verify Host
        if (!ALLOWED_HOSTS.has(parsed.hostname)) {
            console.error(`[SECURITY] Blocked redirect to unauthorized host: ${parsed.hostname}`);
            return fallback;
        }

        // Return path part only for internal consistency, or full URL if trusted
        return parsed.pathname + parsed.search + parsed.hash;
    } catch {
        // Not a valid URL or path
        return fallback;
    }
}
