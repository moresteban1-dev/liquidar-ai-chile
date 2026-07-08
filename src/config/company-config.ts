/**
 * Company & Brand Configuration
 *
 * Centralizes all company identity, contact, and banking details
 * used across PDFs, emails, and public-facing documents.
 *
 * IMPORTANT: Banking details are non-secret business data (publicly shared
 * on invoices). For truly secret credentials, use ENCRYPTION_KEY + env vars.
 */

export const COMPANY_CONFIG = {
    /** Legal / brand identity */
    IDENTITY: {
        NAME: 'Eventos Chile',
        TAGLINE: 'Servicios de Eventos Profesionales',
        RUT: '76.123.456-K',
    },

    /** Contact information */
    CONTACT: {
        EMAIL: 'contacto@eventoschile.cl',
        PAYMENTS_EMAIL: 'pagos@eventoschile.cl',
    },

    /** Bank transfer details (shown on approved quotation PDFs) */
    BANK: {
        BANK_NAME: 'Banco de Chile',
        ACCOUNT_TYPE: 'Cuenta Corriente',
        ACCOUNT_NUMBER: '00-123-45678-09',
    },

    /** PDF Layout Constants */
    PDF: {
        MARGIN: 15,
        FONT_SIZE: {
            TITLE: 18,
            SUBTITLE: 14,
            SECTION_HEADER: 11,
            BODY: 9,
            FOOTER: 8,
        },
        COLORS: {
            TEXT_PRIMARY: 0,
            TEXT_SECONDARY: 80,
            TEXT_MUTED: 100,
            TEXT_LIGHT: 150,
            CLIENT_HEADER: [63, 81, 181] as const,    // Indigo
            PROVIDER_HEADER: [70, 70, 70] as const,   // Dark gray
            BANK_BORDER: [100, 200, 100] as const,    // Green
            BANK_FILL: [240, 255, 240] as const,      // Light green
            BANK_TEXT: [0, 100, 0] as const,           // Dark green
            CLIENT_INFO_FILL: [250, 250, 250] as const,
            PROVIDER_INFO_FILL: [245, 245, 250] as const,
        },
    },

    /** Tax configuration */
    TAX: {
        IVA_RATE: 0.19,
        IVA_LABEL: 'IVA (19%)',
    },
} as const;
