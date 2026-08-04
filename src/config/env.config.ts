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

const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc0NzQsImV4cCI6MjA4NTYxMzQ3NH0.v9MrG2kIDmQ_Kf3NJ-1l2Em99u2NrsOb8_fBh18eIgA';

/**
 * Variables PÚBLICAS - Requeridas siempre (incluso en build)
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().default(DEFAULT_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default(DEFAULT_SUPABASE_ANON_KEY),
  NEXT_PUBLIC_APP_URL: z.string().optional().default('https://liquidar-ai-chile.vercel.app'),
});

/**
 * Variables PRIVADAS - Solo requeridas en runtime
 */
export function validateEnv() {
  const publicEnvResult = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://liquidar-ai-chile.vercel.app',
  });

  if (!publicEnvResult.success) {
    if (IS_RUNTIME && IS_SERVER) {
      console.error('❌ Invalid public environment variables:');
      console.error(JSON.stringify(publicEnvResult.error.format(), null, 2));
    }
  }
  return publicEnvResult;
}

const publicEnvResult = validateEnv();
const publicData = publicEnvResult.success ? publicEnvResult.data : {
  NEXT_PUBLIC_SUPABASE_URL: DEFAULT_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: DEFAULT_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: 'https://liquidar-ai-chile.vercel.app',
};

// 2. Exportar con Getters Protegidos
export const env = {
  IS_BUILD_TIME,
  IS_RUNTIME,
  IS_SERVER,

  NEXT_PUBLIC_SUPABASE_URL: 
    publicData.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env['supabase_SUPABASE_URL'] || 
    DEFAULT_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 
    publicData.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env['supabase_SUPABASE_ANON_KEY'] || 
    process.env['supabase_SUPABASE_PUBLISHABLE_KEY'] || 
    DEFAULT_SUPABASE_ANON_KEY,
  
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    if (IS_BUILD_TIME) return "";
    const value = 
      process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env['supabase_SUPABASE_SERVICE_ROLE_KEY'] || 
      process.env['supabase_SUPABASE_SECRET_KEY'];
    return value || DEFAULT_SUPABASE_ANON_KEY;
  },

  get NODE_ENV(): string {
    return process.env['NODE_ENV'] || 'development';
  }
};
