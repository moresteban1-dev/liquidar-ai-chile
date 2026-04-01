import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAdmin } from '@/lib/api/with-auth';

/**
 * GET /api/admin/migration/dashboard
 * Protected: Admin only.
 */
export const GET = withAdmin(async () => {
    const supabase = await createClient();

    // 1. Current rollout percentage
    const { data: rolloutFlag } = await supabase
        .from('feature_flags')
        .select('value, updated_at')
        .eq('key', 'v2_rollout_percentage')
        .single();

    // 2. Migration complete flag
    const { data: completeFlag } = await supabase
        .from('feature_flags')
        .select('value')
        .eq('key', 'v2_migration_complete')
        .single();

    // 3. Migration event history
    const { data: events } = await supabase
        .from('migration_metrics')
        .select('event, from_percentage, to_percentage, advanced_by, created_at, metadata')
        .order('created_at', { ascending: false })
        .limit(20);

    // 4. Error rate comparison (last 24h)
    const since24h = new Date(Date.now() - 86400_000).toISOString();

    const { count: totalRequests } = await supabase
        .from('notification_log')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since24h);

    const { count: failedRequests } = await supabase
        .from('notification_log')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', since24h);

    const total = totalRequests ?? 0;
    const failed = failedRequests ?? 0;
    const errorRate = total > 0 ? (failed / total) * 100 : 0;

    // 5. Webhook delivery stats (last 24h)
    const { count: webhookSuccess } = await supabase
        .from('webhook_deliveries')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'success')
        .gte('created_at', since24h);

    const { count: webhookFailed } = await supabase
        .from('webhook_deliveries')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', since24h);

    return NextResponse.json({
        data: {
            migration: {
                currentRollout: rolloutFlag?.value ?? 0,
                isComplete: completeFlag?.value ?? false,
                lastUpdated: rolloutFlag?.updated_at ?? null,
            },
            health: {
                period: 'last_24h',
                totalNotifications: total,
                failedNotifications: failed,
                errorRate: Math.round(errorRate * 100) / 100,
                webhookSuccesses: webhookSuccess ?? 0,
                webhookFailures: webhookFailed ?? 0,
            },
            timeline: events ?? [],
            readyForCleanup:
                (completeFlag?.value ?? false) &&
                errorRate < 0.5 &&
                (failed ?? 0) < 10,
        }
    });
});
