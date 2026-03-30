# 📖 DROPSERVICE PLATFORM RUNBOOK

## Quick Links
- **Production**: `https://dropservice-platform.vercel.app`
- **Vercel Dashboard**: `https://vercel.com/dashboard`
- **Supabase Dashboard**: `https://supabase.com/dashboard`
- **Grafana**: Local / Hosted Instance (See `monitoring/grafana-dashboard.json`)
- **Operations Center**: `/admin/operations`

## Common Incidents

### 🔥 High Error Rate
**Symptoms**: Error rate > 1%
**Steps**:
1. Check Operations Center > System Health (`/admin/operations`).
2. Review recent deployments via Vercel Logs.
3. Check Supabase connection pool and latency.
4. If persistent: Execute rollback via Vercel dashboard.

**Rollback Command**:
`vercel rollback`

### 🐌 Slow Response Times
**Symptoms**: P95 latency > 1s
**Steps**:
1. Check Grafana "API Latency" panel.
2. Run manual Cache Warming via Operations Center (`/admin/operations`).
3. Check Supabase for slow queries or missing indexes.
4. Verify n8n webhook queue isn't stalling events.

### 💾 Database Resource Constraints
**Symptoms**: High CPU/Memory or "Connection limit" timeouts in logs.
**Steps**:
1. Check Supabase Dashboard Database metrics.
2. Kill idle connections if necessary via Supabase PgBouncer settings.
3. Scale up Supabase instance if sustained.

### ⚠️ Cron Job Failures
**Symptoms**: Events stall in `pending` status or cache isn't refreshed.
**Steps**:
1. Go to Operations Center > Event Queue Panel.
2. Click "Process Now" manually.
3. Verify Vercel Cron Logs in the deployment dashboard.
4. Ensure `CRON_SECRET` matches between Vercel and source.

## Monitoring Baselines
- **P95 Latency**: < 500ms
- **Error Rate**: < 0.1%
- **DB Pool Usage**: < 80%
- **Request Rate**: 50-200 RPM (normal)
- **Memory Usage**: Vercel limits (Edge/Serverless 1024MB max config)

## Emergency Escalation
- **Tech Lead**: tech-lead@dropservice.com
- **DevOps Ops**: ops@dropservice.com
- **Incident Playbook**: `docs/operations/incident-playbook.md`
