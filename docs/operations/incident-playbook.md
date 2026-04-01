# Incident Response Playbook - Dropservice Platform

This document outlines the standard operating procedures for responding to system incidents.

## 🚨 Severity Levels

| Level | Description | Impact |
| :--- | :--- | :--- |
| **P0 (Critical)** | Core system down | Users cannot place orders or vendors cannot bid. |
| **P1 (High)** | Major feature failure | Notifications not sending, external APIs (Supabase) unreachable. |
| **P2 (Medium)** | Degraded performance | High latency (>2s), Cache hit rate < 40%. |
| **P3 (Low)** | Minor issue | UI inconsistencies, non-critical log errors. |

---

## 🛠️ Common Incident Procedures

### 1. Database Unreachable / High Latency
**Symptoms**: "PostgreSQL" status in Operations Center is "Unhealthy" or latency > 2000ms.
**Procedure**:
1. Check Supabase Status Page.
2. If Supabase is up, verify Service Role Key hasn't expired.
3. Check `get_db_performance_summary` RPC output in Operations Center.
4. Scale DB resources if CPU/Memory > 80%.

### 2. Cache Performance Degradation
**Symptoms**: Cache hit rate < 40%, High memory usage.
**Procedure**:
1. Go to **Operations Center > Cache Monitor**.
2. Click **🗑️ Clear All** to flush potentially corrupted entries.
3. Click **🔥 Warm Cache** to re-populate core entities.
4. Monitor "Evictions" count; increase `MAX_CACHE_SIZE` if evictions are constant.

### 3. Notification Backlog
**Symptoms**: "Notification Log" shows many "failed" entries.
**Procedure**:
1. Filter log by "failed" status.
2. Check error messages (e.g., SMTP Auth, Rate Limit).
3. If SMTP error: Validate environment variables for Resend/SendGrid.
4. If rate limit: Check provider dashboard.

### 4. Event Queue Stalled
**Symptoms**: "Pending" events > 500, "Dead" events > 0.
**Procedure**:
1. Go to **Operations Center > Event Queue**.
2. Click **⚡ Procesar ahora** to trigger manual run.
3. If "Dead" events persist: Check `event_outbox` for circular dependencies or DB constraint violations.
4. Run `supabase/migrations/014_post_migration_cleanup.sql` to clean old entries if needed.

---

## 📞 Escalation Matrix

1. **First Responder**: Duty Senior Engineer.
2. **L2 Support**: System Architect (Antigravity).
3. **L3 Support**: Infrastructure Team / Supabase Enterprise Support.

---

## 🔗 Monitoring URLs
- **Operations Dashboard**: `/admin/operations`
- **System Health JSON**: `/api/admin/system/health`
- **Supabase Dashboard**: `https://supabase.com/dashboard/project/...`
