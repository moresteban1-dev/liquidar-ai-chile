# Migration Runbook: v1 → v2

## 🎯 Overview
This document guides the gradual rollout of v2 endpoints using feature flags and the Migration Monitor.

## 🔄 Rollout Strategy

### Steps
1. **Step 1 (5%)**: Initial canary. Monitor for 30 min.
2. **Step 2 (10%)**: Second canary. Monitor for 1 hour.
3. **Step 3 (25%)**: Mid rollout. Monitor for 2 hours.
4. **Step 4 (50%)**: Half traffic. Monitor for 4 hours.
5. **Step 5 (75%)**: High traffic. Monitor for 6 hours.
6. **Step 6 (100%)**: Full migration.

## 🚨 Emergency Procedures

### High Error Rate (> 2%)
1. Execute `POST /api/admin/migration/emergency`.
2. Traffic reverts to v1 immediately.
3. Check logs in Supabase.

### High Latency (> 2s P95)
1. Execute `PUT /api/admin/migration/rollback`.
2. Investigate DB performance.

## 📊 Monitoring Dashboard
Use `GET /api/admin/migration/status` to view real-time metrics and rollout compatibility.
