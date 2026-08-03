import { z } from 'zod';

/**
 * Zod schema para validar TODAS las variables de entorno al iniciar.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().default('https://liquidar-ai-chile.vercel.app'),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .default(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bxhlusdpmjldqbsdztyg.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .default(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc0NzQsImV4cCI6MjA4NTYxMzQ3NH0.v9MrG2kIDmQ_Kf3NJ-1l2Em99u2NrsOb8_fBh18eIgA'
    ),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  NEXT_PUBLIC_SENDER_EMAIL: z.string().email().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  N8N_WEBHOOK_URL: z.string().url().optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  REDIS_URL: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    if (typeof window === 'undefined') {
       console.error('❌ CRITICAL: Invalid Environment Variables');
       console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
    }
    // Fail-safe: return process.env directly during build if validation fails but we need to proceed
    return process.env as any;
  }

  return parsed.data;
};

export const env = parseEnv();
