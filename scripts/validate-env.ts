import { z } from 'zod';

const EnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100),

  // Auth (NextAuth or custom Supabase Auth params if needed)
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),

  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),

  // n8n
  N8N_WEBHOOK_URL: z.string().url(),
  N8N_API_KEY: z.string().min(20).optional(),
  
  // Resend / Email (si aplica)
  RESEND_API_KEY: z.string().startsWith('re_').optional(),

  // Observability 
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // Cron
  CRON_SECRET: z.string().min(32).optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
});

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');

  try {
    const env = EnvSchema.parse(process.env);
    
    console.log('✅ All required environment variables are present and valid');
    console.log('\n📊 Configuration Summary:');
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Supabase Project: ${new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname}`);
    console.log(`   Payment Gateway: Stripe (Configured: ${!!env.STRIPE_SECRET_KEY})`);
    console.log(`   Observability: OpenTelemetry (${!!env.OTEL_EXPORTER_OTLP_ENDPOINT}) + Sentry (${!!env.NEXT_PUBLIC_SENTRY_DSN})`);
    console.log(`   Automation: n8n (${new URL(env.N8N_WEBHOOK_URL).hostname})`);
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:\n');
      error.errors.forEach(err => {
        console.error(`   • ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\n💡 Check your .env.local file and Vercel environment variables');
      process.exit(1);
    }
    throw error;
  }
}

validateEnvironment();
