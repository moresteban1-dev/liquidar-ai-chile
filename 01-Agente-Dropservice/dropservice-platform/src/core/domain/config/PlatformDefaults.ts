export const PLATFORM_DEFAULTS = {
  DOWN_PAYMENT_PERCENTAGE: 50,
  TAX_RATE: 0,
  MIN_MARGIN: 0.15,
} as const;

export type PlatformDefaultKey = keyof typeof PLATFORM_DEFAULTS;
