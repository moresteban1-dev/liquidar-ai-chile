// src/config/env.config.ts
// Validación de variables de entorno FLEXIBLE (Build Time vs Runtime)

import { z } from 'zod';

/**
 * Detecta si estamos en tiempo de build (CI/CD) o en runtime
 */
const IS_BUILD_TIME = 
  process.env['NEXT_PHASE'] === 'phase-production-build' ||
  process.env['CI'] === 'true' ||
  (typeof window === 'undefined' && !process.env['VERCEL_URL'] && process.env['NODE_ENV'] === 'production');

const IS_RUNTIME = !IS_BUILD_TIME;
const IS_SERVER = typeof window === 'undefined';

/**
 * Variables PÚBLICAS - Requeridas siempre (incluso en build)
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL',
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required',
  }),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

/**
 * Variables PRIVADAS - Solo requeridas en runtime
 */
export function validateEnv() {
  const publicEnvResult = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
  });

  if (!publicEnvResult.success) {
    if (IS_RUNTIME && IS_SERVER) {
      console.error('❌ Invalid public environment variables:');
      console.error(JSON.stringify(publicEnvResult.error.format(), null, 2));
      throw new Error('Missing required public environment variables');
    }
  }
  return publicEnvResult;
}

const publicEnvResult = validateEnv();
const publicData = publicEnvResult.success ? publicEnvResult.data : ({} as any);

// 2. Exportar con Getters Protegidos
export const env = {
  IS_BUILD_TIME,
  IS_RUNTIME,
  IS_SERVER,

  NEXT_PUBLIC_SUPABASE_URL: publicData.NEXT_PUBLIC_SUPABASE_URL || process.env['NEXT_PUBLIC_SUPABASE_URL'] || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: publicData.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '',
  
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    if (IS_BUILD_TIME) return "";
    const value = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    if (!value && IS_RUNTIME && IS_SERVER && process.env['NODE_ENV'] === 'production') {
       throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing in production runtime');
    }
    return value || "";
  },

  get NODE_ENV(): string {
    return process.env['NODE_ENV'] || 'development';
  }
};
