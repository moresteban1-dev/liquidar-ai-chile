import { z } from 'zod';

/**
 * Zod schema para validar TODAS las variables de entorno al iniciar.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  NEXT_PUBLIC_SENDER_EMAIL: z.string().email().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_ALERT_EMAIL: z.string().email().optional(),
  N8N_WEBHOOK_URL: z.string().url().optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  REDIS_URL: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  NEXT_PUBLIC_DEFAULT_CURRENCY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NEXT_PHASE: z.string().optional(),
});

const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc0NzQsImV4cCI6MjA4NTYxMzQ3NH0.v9MrG2kIDmQ_Kf3NJ-1l2Em99u2NrsOb8_fBh18eIgA';

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    if (typeof window === 'undefined') {
       console.error('❌ CRITICAL: Invalid Environment Variables');
       console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
    }
  }

  const baseEnv = parsed.success ? parsed.data : (process.env as any);

  return {
    ...baseEnv,
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
    NEXT_PUBLIC_SUPABASE_URL: 
      process.env.NEXT_PUBLIC_SUPABASE_URL || 
      process.env['supabase_SUPABASE_URL'] || 
      DEFAULT_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      process.env['supabase_SUPABASE_ANON_KEY'] || 
      process.env['supabase_SUPABASE_PUBLISHABLE_KEY'] || 
      DEFAULT_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: 
      process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env['supabase_SUPABASE_SERVICE_ROLE_KEY'] || 
      process.env['supabase_SUPABASE_SECRET_KEY'],
    CRON_SECRET: process.env.CRON_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    ADMIN_ALERT_EMAIL: process.env.ADMIN_ALERT_EMAIL,
    NEXT_PUBLIC_DEFAULT_CURRENCY: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'CLP',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    REDIS_URL: process.env.REDIS_URL,
    NEXT_PHASE: process.env.NEXT_PHASE,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  };
};

export const env = parseEnv();
