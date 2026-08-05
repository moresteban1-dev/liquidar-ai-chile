# Technical Orchestration Plan: Liquidar.cl Supabase Env Fix

## Objective
Diagnose and resolve the "Missing Supabase environment variables" error occurring at Root Layout level during Vercel production build/runtime for Liquidar.cl, ensuring predictable behavior and system stability.

## Milestones & Phased Execution

### Phase 0: Survey & Investigation (Parallel Explorers)
- **Explorer 1 (Env & Config)**: Investigate `src/config/env.ts`, environment schema validation, and server/client environment variable access patterns (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- **Explorer 2 (Root Layout & Supabase Clients)**: Investigate `src/app/layout.tsx`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, and root level initialization logic.
- **Explorer 3 (Build System & Vercel Setup)**: Investigate build scripts, Next.config, `.env` loading mechanics, and test running `npm run build` under different env state scenarios.

### Phase 1: Milestone Decomposition (`PROJECT.md`)
- Consolidate Explorer findings.
- Define interface contracts, scope, and specific code change requirements.

### Phase 2: Implementation (Worker)
- Worker modifies configuration/initialization logic to prevent premature module-level evaluation crashes during build/SSR while maintaining strict runtime validation or safe fallbacks.
- Worker runs `npm run build` and tests locally.

### Phase 3: Gate Verification
- **2 Reviewers (`teamwork_preview_reviewer`)**: Code review, standards, spec compliance, edge case verification.
- **2 Challengers (`teamwork_preview_challenger`)**: Stress testing, build-time env stripping tests, runtime client/server component behavior verification.
- **1 Forensic Auditor (`teamwork_preview_auditor`)**: Integrity check (verifying genuine fix without hardcoding or facades).

### Phase 4: Synthesis & Victory Report
- Synthesize all gate results and report outcomes to parent/user.
