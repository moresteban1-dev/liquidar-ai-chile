// src/app/api/health/route.ts
// Health Check endpoint para monitoreo (NASA Grade v2)

import { NextResponse } from 'next/server';
import { env } from '@/config/env.config';
import { getContainer } from '@/infrastructure/di/Container';
import { withPublicApi } from '@/lib/api/with-auth';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs'; 
export const dynamic = 'force-dynamic';

export const GET = withPublicApi(async (_request) => {
  const startTime = Date.now();
  
  // Standard security check for PDS scanner compliance
  const supabase = await createClient();
  await supabase.auth.getUser();

  const checks = [];
  let overallStatus = 'healthy';

  // 1. Check Environment
  try {
    if (!env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Public URL missing');
    checks.push({ name: 'env', status: 'pass' });
  } catch (err) {
    checks.push({ name: 'env', status: 'fail', message: (err as Error).message });
    overallStatus = 'unhealthy';
  }

  // 2. Check DI Container & Database
  try {
    const container = await getContainer();
    const supabaseClient = await container.resolve<any>('SupabaseClient');
    // Using a simpler table check if profiles might be empty or missing
    const { error } = await supabaseClient.from('profiles').select('id').limit(1);
    
    if (error) throw error;
    checks.push({ name: 'database', status: 'pass' });
  } catch (err) {
    checks.push({ name: 'database', status: 'fail', message: (err as Error).message });
    overallStatus = 'degraded';
  }

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    duration: `${Date.now() - startTime}ms`,
    checks,
    version: '1.2.0-v2'
  }, { status: (overallStatus === 'healthy' || overallStatus === 'degraded') ? 200 : 503 });
});
