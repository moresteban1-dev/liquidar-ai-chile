import sanitizeHtml from 'sanitize-html';

/**
 * XSS Sanitization Utility (Sprint H)
 * 
 * Configures `sanitize-html` with a strict profile intended for text inputs
 * that should not contain executed vectors, scripts, or dangerous embeds.
 */

const STRICT_CONFIG = {
    allowedTags: [
        'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
    ],
    allowedAttributes: {
        'a': ['href', 'target', 'rel']
    },
    allowedIframeHostnames: [], // Block all iframes
    disallowedTagsMode: 'discard' as const, // Remove dangerous tags entirely
};

/**
 * Strips dangerous HTML from user inputs.
 * Use this on rich text fields, category descriptions, or item notes.
 */
export function sanitizeRichText(input: string): string {
    if (!input) return input;
    return sanitizeHtml(input, STRICT_CONFIG);
}

/**
 * Strips absolutely ALL HTML from user inputs, leaving only plain text.
 * Use this for standard text fields (names, titles, simple descriptions).
 */
export function sanitizePlainText(input: string): string {
    if (!input) return input;
    return sanitizeHtml(input, {
        allowedTags: [],
        allowedAttributes: {}
    });
}
