# 🎯 TEAM HANDOFF DOCUMENT

## Platform Overview
Dropservice is a B2B2C marketplace connecting clients with specialized service providers through an admin orchestrator. The platform has now officially transitioned to the fully optimized V2 Architecture.

## Architecture Stack
- **Frontend**: Next.js 15 (App Router) + TypeScript + TailwindCSS + Radix UI
- **Backend (BaaS)**: Supabase Enterprise / Pro
  - **Database**: PostgreSQL 15
  - **Auth**: Supabase Auth (JWT)
  - **Storage**: Supabase Storage
- **Architecture Pattern**: Clean Architecture (Hexagonal / Ports & Adapters)
- **Deployment**: Vercel Serverless / Edge Functions
- **Async Processing**: BullMQ (Redis) / Domain Event Bus
- **Automation**: n8n Webhooks

## Key Features
1. **Triple-State Pricing Engine**: Distinct, transparent views for Client/Admin/Provider rules.
2. **Smart Quotation Wizard**: Contextual event brief collection.
3. **Order FSM**: Strictly typed State Machine governing the order lifecycle.
4. **RBAC at DB Level**: Row-Level Security ensuring zero data leaks.
5. **NASA-Grade Observability**: Integrates OpenTelemetry, Sentry, and custom Ops Dashboard.

## Repository Structure (V2)
```text
src/
├── core/            # Domain layer (Zero external dependencies, pure business logic)
├── infrastructure/  # Adapters (Supabase, HTTP handlers, n8n integrations, Email)
├── presentation/    # Application layer (Next.js Pages, Server Actions, ViewModels)
└── actions/         # Next.js Server Actions (RPCs to infrastructure)
```

## Daily Operations
- **Deployments**: Pushing to the `main` branch triggers automatic production deployment on Vercel.
- **Monitoring**: 
  - Admin Operations Center (`/admin/operations`)
  - Grafana dashboard (infrastructure level)
- **Errors**: Sentry catches unhandled exceptions.
- **Cron Jobs**: Run systematically (Events processor, cache warming).

## Support & Incident Escalation
1. **Level 1**: Check `incident-playbook.md` (Admin Operations page features).
2. **Level 2**: Review `RUNBOOK.md`.
3. **Level 3**: Rollback via Vercel Dashboard to a previous healthy state.
4. **Level 4**: Escalate to Senior Engineering Team.

## Final Note on V1 Removal
All legacy Next.js `Pages Router` logic, `useEffect`-based data fetching, and unprotected client-side Supabase queries have been purged. Only V2 Server Components and structured APIs remain active. Welcome to Dropservice 2.0!
