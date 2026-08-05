# Project: Liquidar.cl Supabase Environment Variable Resolution

## Architecture
- Framework: Next.js 15 (App Router)
- Components: Root Layout (`src/app/layout.tsx`), Config (`next.config.ts`, `src/config/env.ts`), Supabase Client Initializers (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/lib/supabase/api.ts`, `src/infrastructure/persistence/supabase/SupabaseClient.ts`), Root Components (`src/components/layout/Navbar.tsx`, `src/context/NotificationContext.tsx`).
- Target Environment: Local Node.js build (`npm run build`) & Vercel Production Deployment.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Fix `next.config.ts` Duplicate Key | Merge duplicate `env` key blocks in `next.config.ts` so `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` fallbacks are not overwritten | M1 | Explorer 3 |
| 2 | Harmonize Fallback Credentials | Set valid default fallback credentials (`https://bxhlusdpmjldqbsdztyg.supabase.co` & anon key) across `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/infrastructure/persistence/supabase/SupabaseClient.ts`, and `src/config/env.ts` | M1 | Explorers 1, 2, 3 |
| 3 | Defensive Root Component Initialization | Add safe guard handling in `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` so `@supabase/ssr` `createBrowserClient` / `createServerClient` are never called with empty strings `''` | M1 | Explorers 1, 2 |
| 4 | Defensive Root Components | Protect `createClient()` calls in `src/components/layout/Navbar.tsx` and `src/context/NotificationContext.tsx` with error handling / try-catch so failure does not crash `RootLayout` | M1 | Explorers 1, 2 |

## Code Layout & File Responsibilities
- `next.config.ts`: Main Next.js configuration. Needs `env:` object merged into a single property block.
- `src/lib/supabase/client.ts`: Browser Supabase client factory. Needs valid fallback credentials (`https://bxhlusdpmjldqbsdztyg.supabase.co` and anon key) matching `middleware.ts` & `env.config.ts`.
- `src/lib/supabase/server.ts`: Server Supabase client factory. Needs valid fallback credentials matching `client.ts`.
- `src/infrastructure/persistence/supabase/SupabaseClient.ts`: Infrastructure client instance creator. Remove `!` non-null assertion, use safe fallback credentials.
- `src/config/env.ts`: Central env schema parser. Ensure fallback to valid default URL/key instead of empty string `''`.
- `src/components/layout/Navbar.tsx`: Navbar component inside RootLayout. Wrap `createClient()` call in try/catch or safe initialization.
- `src/context/NotificationContext.tsx`: Notification context provider inside RootLayout. Wrap `createClient()` call in try/catch or safe initialization.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Fix Supabase Env Handling & Root Layout Crash | `next.config.ts`, `src/lib/supabase/*`, `src/infrastructure/persistence/supabase/SupabaseClient.ts`, `src/config/env.ts`, `src/components/layout/Navbar.tsx`, `src/context/NotificationContext.tsx` | none | DONE |

## Interface Contracts
### `next.config.ts`
- Must export a single `env` block containing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, and `NEXT_TELEMETRY_DISABLED`.

### `src/lib/supabase/client.ts` & `src/lib/supabase/server.ts`
- `DEFAULT_SUPABASE_URL` MUST NOT be `''` (empty string). It MUST be `process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bxhlusdpmjldqbsdztyg.supabase.co'`.
- `DEFAULT_SUPABASE_ANON_KEY` MUST NOT be `''` (empty string). It MUST be `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1...'`.
- `createClient()` MUST return a valid `SupabaseClient` instance without throwing uncaught exceptions.
